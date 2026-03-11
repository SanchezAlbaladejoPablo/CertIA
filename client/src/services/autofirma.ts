/**
 * Integración con AutoFirma — aplicación oficial del Gobierno de España.
 * Usa autoscript.js (Ministerio de Asuntos Económicos y Transformación Digital).
 *
 * Repositorio oficial: https://github.com/ctt-gob-es/clienteafirma
 * Descargar autoscript.js y colocar en: client/public/afirma/js/autoscript.js
 *
 * IMPLEMENTACIÓN ACTUAL: firma monofásica (PAdES).
 * El documento HTML se firma completo en el cliente.
 * Ver: documentation/PENDIENTE_INFRAESTRUCTURA.md para migración a firma trifásica.
 */

declare const AutoScript: {
  cargarAppAfirma: () => void;
  // Firma real: sign(dataB64, algorithm, format, extraParams, successCb, errorCb)
  sign: (
    data: string,
    algorithm: string,
    format: string,
    extraParams: Record<string, string>,
    successCallback: (signatureB64: string) => void,
    errorCallback: (type: string, message: string) => void
  ) => void;
} | undefined;

export interface AutoFirmaResult {
  signatureB64: string; // Firma en Base64 (CAdES/PAdES según formato)
  signerName?: string;
}

export type AutoFirmaStatus = 'available' | 'script_not_loaded' | 'not_initialized';

/**
 * Comprueba si autoscript.js está cargado y AutoFirma disponible.
 */
export function checkAutoFirmaStatus(): AutoFirmaStatus {
  if (typeof AutoScript === 'undefined') {
    return 'script_not_loaded';
  }
  return 'available';
}

export function isAutoFirmaAvailable(): boolean {
  return checkAutoFirmaStatus() === 'available';
}

/**
 * Inicializa AutoFirma. Llamar una vez al montar la app.
 * Si autoscript.js no está cargado, no hace nada.
 */
export function initAutoFirma(): void {
  if (typeof AutoScript !== 'undefined') {
    AutoScript.cargarAppAfirma();
  }
}

/**
 * Firma un documento usando AutoFirma (firma monofásica PAdES).
 *
 * @param dataB64 - Datos a firmar codificados en Base64
 * @returns Promise con la firma en Base64
 */
export function signWithAutoFirma(dataB64: string): Promise<AutoFirmaResult> {
  return new Promise((resolve, reject) => {
    if (typeof AutoScript === 'undefined') {
      reject(new Error('autoscript.js no está cargado. Consulta la guía de instalación de AutoFirma.'));
      return;
    }

    const extraParams: Record<string, string> = {
      // Firma monofásica: el documento completo se firma en el cliente
      // Para firma trifásica añadir: serverUrl, documentId (ver PENDIENTE_INFRAESTRUCTURA.md)
    };

    AutoScript.sign(
      dataB64,
      'SHA512withRSA',
      'PAdES',
      extraParams,
      (signatureB64: string) => {
        resolve({ signatureB64 });
      },
      (errorType: string, errorMessage: string) => {
        if (errorType === 'cancel') {
          reject(new Error('Firma cancelada por el usuario'));
        } else {
          reject(new Error(`Error en AutoFirma (${errorType}): ${errorMessage}`));
        }
      }
    );
  });
}

export const AUTOFIRMA_DOWNLOAD_URL = 'https://firmaelectronica.gob.es/Home/Descargas.html';
export const AUTOFIRMA_SCRIPT_REPO = 'https://github.com/ctt-gob-es/clienteafirma';
