import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { obtenerMiEmpresaApi, type EmpresaData } from '../api/matriculasPagosApi';

type FormatoRecibo = 'termico32' | 'termico48' | 'pdf';

interface ReciboData {
  abonoId: string;
  monto: number;
  metodoPago: string;
  fechaAbono: string;
  referencia?: string;
  nota?: string;
  usuarioNombre: string;
  pagoId: string;
  numeroPago: number;
  planPagoNombre: string;
  subtotal: number;
  impuestoPorcentaje: number;
  impuestoMonto: number;
  totalPago: number;
  totalAbonado: number;
  saldoPendiente: number;
  estudianteNombre: string;
  estudianteApellidos: string;
}

interface ReciboProps {
  data: ReciboData;
  empresa: EmpresaData | null;
  logoBase64?: string | null;
}

const formatMonto = (monto: number): string => {
  return `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const formatTimeShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

// Recibo térmico 32 caracteres (58mm)
const ReciboTermico32: React.FC<ReciboProps> = ({ data, empresa, logoBase64 }) => {
  const linea = '================================';
  const fmt = (m: number) => `$${(m || 0).toFixed(2)}`;

  // Valores por defecto si no vienen definidos
  const subtotal = data.subtotal ?? data.totalPago;
  const impuestoPorcentaje = data.impuestoPorcentaje ?? 0;
  const impuestoMonto = data.impuestoMonto ?? 0;

  const logoSrc = logoBase64 || empresa?.pathLogo;

  return (
    <div className="font-mono text-[11px] leading-tight bg-white p-2 text-black" style={{ width: '58mm', minHeight: '100mm' }}>
      {/* Logo y datos empresa */}
      {empresa && (
        <div className="text-center mb-1">
          {logoSrc && (
            <img
              src={logoSrc}
              alt="Logo"
              className="mx-auto mb-1"
              style={{ maxWidth: '40mm', maxHeight: '15mm', objectFit: 'contain' }}
            />
          )}
          <div className="font-bold text-xs">{empresa.nombre}</div>
          <div className="text-[9px]">{empresa.identificacion}</div>
          {empresa.telefono && <div className="text-[9px]">{empresa.telefono}</div>}
        </div>
      )}
      <div className="text-center font-bold text-sm">RECIBO DE PAGO</div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-1">
        <div>Fecha: {formatDateShort(data.fechaAbono)}</div>
        <div>Hora: {formatTimeShort(data.fechaAbono)}</div>
        <div>Recibo: #{data.abonoId.slice(-8).toUpperCase()}</div>
      </div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-1">
        <div className="font-bold">ESTUDIANTE:</div>
        <div className="truncate">{data.estudianteNombre}</div>
        <div className="truncate">{data.estudianteApellidos}</div>
      </div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-1">
        <div className="font-bold">DETALLE:</div>
        <div className="truncate">{data.planPagoNombre}</div>
        <div>Pago #{data.numeroPago}</div>
      </div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-1">
        <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
        {impuestoPorcentaje > 0 && (
          <div className="flex justify-between"><span>IVA ({impuestoPorcentaje}%):</span><span>{fmt(impuestoMonto)}</span></div>
        )}
        <div className="flex justify-between font-bold"><span>Total:</span><span>{fmt(data.totalPago)}</span></div>
      </div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-1">
        <div className="flex justify-between"><span>Abonado:</span><span>{fmt(data.totalAbonado)}</span></div>
        <div className="flex justify-between"><span>Saldo:</span><span>{fmt(data.saldoPendiente)}</span></div>
      </div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-1">
        <div className="flex justify-between font-bold text-sm"><span>ABONO:</span><span>{fmt(data.monto)}</span></div>
        <div className="text-[10px]">Metodo: {data.metodoPago}</div>
        {data.referencia && <div className="text-[10px]">Ref: {data.referencia}</div>}
      </div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-2 text-center text-[9px]">
        <div>Atendio: {data.usuarioNombre}</div>
        <div className="mt-2">Gracias por su pago</div>
        {empresa?.correo && <div className="mt-1">{empresa.correo}</div>}
      </div>
    </div>
  );
};

// Recibo térmico 48 caracteres (80mm)
const ReciboTermico48: React.FC<ReciboProps> = ({ data, empresa, logoBase64 }) => {
  const linea = '================================================';
  const fmt = (m: number) => `$${(m || 0).toFixed(2)}`;

  // Valores por defecto si no vienen definidos
  const subtotal = data.subtotal ?? data.totalPago;
  const impuestoPorcentaje = data.impuestoPorcentaje ?? 0;
  const impuestoMonto = data.impuestoMonto ?? 0;

  const logoSrc = logoBase64 || empresa?.pathLogo;

  return (
    <div className="font-mono text-xs leading-tight bg-white p-3 text-black" style={{ width: '80mm', minHeight: '120mm' }}>
      {/* Logo y datos empresa */}
      {empresa && (
        <div className="text-center mb-2">
          {logoSrc && (
            <img
              src={logoSrc}
              alt="Logo"
              className="mx-auto mb-1"
              style={{ maxWidth: '50mm', maxHeight: '20mm', objectFit: 'contain' }}
            />
          )}
          <div className="font-bold">{empresa.nombre}</div>
          <div className="text-[10px]">{empresa.identificacion}</div>
          {empresa.telefono && <div className="text-[10px]">{empresa.telefono}</div>}
          {empresa.correo && <div className="text-[10px]">{empresa.correo}</div>}
        </div>
      )}
      <div className="text-center font-bold text-base">RECIBO DE PAGO</div>
      <div className="text-[10px]">{linea}</div>
      <div className="mt-2 grid grid-cols-2 gap-x-2">
        <div>Fecha: {formatDateShort(data.fechaAbono)}</div>
        <div>Hora: {formatTimeShort(data.fechaAbono)}</div>
      </div>
      <div>No. Recibo: #{data.abonoId.slice(-8).toUpperCase()}</div>
      <div className="text-[10px] mt-1">{linea}</div>
      <div className="mt-2">
        <div className="font-bold">ESTUDIANTE:</div>
        <div>{data.estudianteNombre} {data.estudianteApellidos}</div>
      </div>
      <div className="text-[10px] mt-1">{linea}</div>
      <div className="mt-2">
        <div className="font-bold">CONCEPTO:</div>
        <div>{data.planPagoNombre}</div>
        <div>Pago #{data.numeroPago}</div>
      </div>
      <div className="text-[10px] mt-1">{linea}</div>
      <div className="mt-2">
        <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
        {impuestoPorcentaje > 0 && (
          <div className="flex justify-between"><span>IVA ({impuestoPorcentaje}%):</span><span>{fmt(impuestoMonto)}</span></div>
        )}
        <div className="flex justify-between font-bold"><span>Total del Pago:</span><span>{fmt(data.totalPago)}</span></div>
      </div>
      <div className="text-[10px] mt-1">{linea}</div>
      <div className="mt-2">
        <div className="flex justify-between"><span>Total Abonado:</span><span>{fmt(data.totalAbonado)}</span></div>
        <div className="flex justify-between font-bold"><span>Saldo Pendiente:</span><span>{fmt(data.saldoPendiente)}</span></div>
      </div>
      <div className="text-[10px] mt-1">{linea}</div>
      <div className="mt-2">
        <div className="flex justify-between font-bold text-sm"><span>MONTO ABONADO:</span><span>{fmt(data.monto)}</span></div>
        <div className="mt-1">Metodo: {data.metodoPago}</div>
        {data.referencia && <div>Ref: {data.referencia}</div>}
        {data.nota && <div className="text-[10px] mt-1">Nota: {data.nota}</div>}
      </div>
      <div className="text-[10px] mt-1">{linea}</div>
      <div className="mt-3 text-center text-[10px]">
        <div>Atendido por: {data.usuarioNombre}</div>
        <div className="mt-2">Gracias por su pago</div>
      </div>
    </div>
  );
};

// Recibo PDF - Formato A4
const ReciboPDF: React.FC<ReciboProps> = ({ data, empresa, logoBase64 }) => {
  const formatDateLong = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const logoSrc = logoBase64 || empresa?.pathLogo;

  return (
    <div className="bg-white p-10 text-black" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
      {/* Encabezado */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-shrink-0" style={{ width: '45mm' }}>
          {logoSrc && (
            <img
              src={logoSrc}
              alt="Logo"
              style={{ maxWidth: '45mm', maxHeight: '30mm', objectFit: 'contain' }}
            />
          )}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-teal-700 tracking-wide">RECIBO DE PAGO</h1>
          <div className="mt-2 text-sm">
            <div><span className="font-bold">FECHA:</span> {formatDateLong(data.fechaAbono)}</div>
            <div><span className="font-bold">RECIBO:</span> #{data.abonoId.slice(-8).toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Datos de Empresa y Estudiante */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Empresa */}
        <div className="border border-neutral-300">
          <div className="bg-teal-600 text-white text-center py-1 text-sm font-semibold">
            EMPRESA
          </div>
          <div className="p-3 text-sm leading-relaxed">
            {empresa && (
              <>
                <div>{empresa.nombre}</div>
                <div>{empresa.identificacion}</div>
                {empresa.telefono && <div>Tel: {empresa.telefono}</div>}
                {empresa.correo && <div>{empresa.correo}</div>}
              </>
            )}
          </div>
        </div>
        {/* Estudiante */}
        <div className="border border-neutral-300">
          <div className="bg-teal-600 text-white text-center py-1 text-sm font-semibold">
            ESTUDIANTE
          </div>
          <div className="p-3 text-sm leading-relaxed">
            <div className="font-semibold">{data.estudianteNombre} {data.estudianteApellidos}</div>
            <div className="mt-2 text-neutral-600">
              <div>Concepto: {data.planPagoNombre}</div>
              <div>Pago #{data.numeroPago}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Detalle */}
      <table className="w-full border-collapse mb-6 text-sm">
        <thead>
          <tr className="bg-teal-600 text-white">
            <th className="border border-neutral-300 px-3 py-2 text-left w-12">ID</th>
            <th className="border border-neutral-300 px-3 py-2 text-left">DESCRIPCION</th>
            <th className="border border-neutral-300 px-3 py-2 text-right w-24">CANTIDAD</th>
            <th className="border border-neutral-300 px-3 py-2 text-right w-28">PRECIO UNIT.</th>
            <th className="border border-neutral-300 px-3 py-2 text-right w-28">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-neutral-300 px-3 py-2 text-center">1</td>
            <td className="border border-neutral-300 px-3 py-2">{data.planPagoNombre} - Pago #{data.numeroPago}</td>
            <td className="border border-neutral-300 px-3 py-2 text-right">1</td>
            <td className="border border-neutral-300 px-3 py-2 text-right">{formatMonto(data.subtotal)}</td>
            <td className="border border-neutral-300 px-3 py-2 text-right">{formatMonto(data.subtotal)}</td>
          </tr>
          {/* Filas vacías para mantener estructura */}
          {[...Array(3)].map((_, i) => (
            <tr key={i}>
              <td className="border border-neutral-300 px-3 py-2">&nbsp;</td>
              <td className="border border-neutral-300 px-3 py-2"></td>
              <td className="border border-neutral-300 px-3 py-2"></td>
              <td className="border border-neutral-300 px-3 py-2 text-right">$</td>
              <td className="border border-neutral-300 px-3 py-2 text-right">-</td>
            </tr>
          ))}
          {/* Subtotal */}
          <tr>
            <td colSpan={4} className="border border-neutral-300 px-3 py-2 text-right font-semibold">SUBTOTAL</td>
            <td className="border border-neutral-300 px-3 py-2 text-right">{formatMonto(data.subtotal)}</td>
          </tr>
          {/* Impuesto */}
          <tr>
            <td colSpan={4} className="border border-neutral-300 px-3 py-2 text-right">IVA ({data.impuestoPorcentaje || 0}%)</td>
            <td className="border border-neutral-300 px-3 py-2 text-right">{formatMonto(data.impuestoMonto || 0)}</td>
          </tr>
          {/* Total del Pago */}
          <tr className="bg-neutral-100">
            <td colSpan={4} className="border border-neutral-300 px-3 py-2 text-right font-bold">TOTAL DEL PAGO</td>
            <td className="border border-neutral-300 px-3 py-2 text-right font-bold">{formatMonto(data.totalPago)}</td>
          </tr>
          {/* Abono Actual */}
          <tr className="bg-teal-50">
            <td colSpan={4} className="border border-neutral-300 px-3 py-2 text-right font-bold text-teal-700">ABONO ACTUAL</td>
            <td className="border border-neutral-300 px-3 py-2 text-right font-bold text-teal-700">{formatMonto(data.monto)}</td>
          </tr>
          {/* Saldo Pendiente */}
          <tr>
            <td colSpan={4} className="border border-neutral-300 px-3 py-2 text-right font-semibold">SALDO PENDIENTE</td>
            <td className="border border-neutral-300 px-3 py-2 text-right font-semibold">{formatMonto(data.saldoPendiente)}</td>
          </tr>
        </tbody>
      </table>

      {/* Informacion de Pago */}
      <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
        <div className="border border-neutral-300 p-3">
          <div className="font-semibold text-neutral-600 mb-1">Metodo de Pago</div>
          <div>{data.metodoPago}</div>
        </div>
        {data.referencia && (
          <div className="border border-neutral-300 p-3">
            <div className="font-semibold text-neutral-600 mb-1">Referencia</div>
            <div className="font-mono">{data.referencia}</div>
          </div>
        )}
        <div className="border border-neutral-300 p-3">
          <div className="font-semibold text-neutral-600 mb-1">Atendido por</div>
          <div>{data.usuarioNombre}</div>
        </div>
      </div>

      {/* Pie de pagina */}
      <div className="flex justify-between items-end mt-10">
        <div className="text-sm">
          <div className="font-bold text-teal-700 mb-4">GRACIAS POR SU PREFERENCIA</div>
          <div className="mb-6">
            <div>Firma / Sello:</div>
            <div className="border-b border-neutral-400 w-48 mt-8"></div>
          </div>
          <div className="mb-2">
            <span>Lugar: </span>
            <span className="border-b border-neutral-400 inline-block w-40"></span>
          </div>
          <div>
            <span>Fecha: </span>
            <span className="border-b border-neutral-400 inline-block w-40"></span>
          </div>
        </div>
        <div className="text-right text-xs text-neutral-400">
          {empresa?.correo && <div>{empresa.correo}</div>}
          {empresa?.telefono && <div>{empresa.telefono}</div>}
        </div>
      </div>
    </div>
  );
};

// Función para convertir imagen URL a base64
const imageToBase64 = async (url: string): Promise<string | null> => {
  // Método 1: Usar fetch con blob
  const tryFetch = async (): Promise<string | null> => {
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'include'
      });
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Método 2: Usar Image + Canvas
  const tryCanvas = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      // Agregar timestamp para evitar cache
      img.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    });
  };

  // Intentar primero con fetch, luego con canvas
  let result = await tryFetch();
  if (!result) {
    result = await tryCanvas();
  }
  return result;
};

export const PrintReciboPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formato, setFormato] = useState<FormatoRecibo>('termico48');
  const printRef = useRef<HTMLDivElement>(null);
  const reciboData = location.state as ReciboData | null;

  const [generando, setGenerando] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const response = await obtenerMiEmpresaApi();
        const empresaData = response.data;
        setEmpresa(empresaData);

        // Convertir logo a base64 para evitar problemas con html2canvas
        if (empresaData?.pathLogo) {
          const base64 = await imageToBase64(empresaData.pathLogo);
          setLogoBase64(base64);
        }
      } catch (error) {
        console.error('Error al obtener datos de empresa:', error);
      } finally {
        setLoadingEmpresa(false);
      }
    };
    fetchEmpresa();
  }, []);

  // Obtener dimensiones del papel en mm según formato
  const getPaperSize = () => {
    switch (formato) {
      case 'termico32':
        return { width: 58, height: null, unit: 'mm' as const };
      case 'termico48':
        return { width: 80, height: null, unit: 'mm' as const };
      case 'pdf':
        return { width: 210, height: 297, unit: 'mm' as const }; // A4
    }
  };

  // Esperar a que todas las imágenes dentro del elemento estén cargadas
  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(promises);
  };

  const handleGeneratePDF = async () => {
    if (!printRef.current) return;

    setGenerando(true);
    try {
      const element = printRef.current;
      const paperSize = getPaperSize();

      // Esperar a que las imágenes estén cargadas
      await waitForImages(element);

      // Convertir el elemento HTML a canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor calidad
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/png');

      // Calcular altura proporcional basada en el contenido
      const imgWidth = paperSize.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Crear PDF con el tamaño exacto del contenido
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, imgHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Abrir el PDF en una nueva pestaña para imprimir
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setGenerando(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    setGenerando(true);
    try {
      const element = printRef.current;
      const paperSize = getPaperSize();

      // Esperar a que las imágenes estén cargadas
      await waitForImages(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = paperSize.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, imgHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Recibo-${reciboData?.abonoId?.slice(-8) || 'pago'}.pdf`);

    } catch (error) {
      console.error('Error descargando PDF:', error);
    } finally {
      setGenerando(false);
    }
  };

  if (!reciboData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">No hay datos de recibo</p>
        <button onClick={() => navigate('/pagos')} className="text-sm text-emerald-600 hover:underline">
          Volver a Pagos
        </button>
      </div>
    );
  }

  if (loadingEmpresa) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <CgSpinner className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(`/pagos/view/${reciboData.pagoId}`)}
          className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <FaArrowLeft className="w-3 h-3" />
          Volver
        </button>
        <div className="text-sm text-neutral-500">
          Recibo #{reciboData.abonoId.slice(-8).toUpperCase()} - {formatMonto(reciboData.monto)}
        </div>
      </div>

      {/* Controles en una línea */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white dark:bg-dark-card rounded-lg border border-neutral-200 dark:border-dark-border">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Formato:</span>
        <div className="flex gap-1">
          {[
            { id: 'termico32' as FormatoRecibo, label: '58mm' },
            { id: 'termico48' as FormatoRecibo, label: '80mm' },
            { id: 'pdf' as FormatoRecibo, label: 'PDF' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFormato(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                formato === f.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={generando}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-600 hover:bg-neutral-700 disabled:bg-neutral-400 text-white text-sm font-medium rounded transition-colors"
          >
            <FaDownload className="w-3 h-3" />
            {generando ? 'Generando...' : 'Descargar'}
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={generando}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white text-sm font-medium rounded transition-colors"
          >
            <FaPrint className="w-3 h-3" />
            {generando ? 'Generando...' : 'Imprimir'}
          </button>
        </div>
      </div>

      {/* Vista previa */}
      <div className="flex justify-center overflow-auto bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
        <div ref={printRef} className="shadow-lg">
          {formato === 'termico32' && <ReciboTermico32 data={reciboData} empresa={empresa} logoBase64={logoBase64} />}
          {formato === 'termico48' && <ReciboTermico48 data={reciboData} empresa={empresa} logoBase64={logoBase64} />}
          {formato === 'pdf' && <ReciboPDF data={reciboData} empresa={empresa} logoBase64={logoBase64} />}
        </div>
      </div>
    </div>
  );
};
