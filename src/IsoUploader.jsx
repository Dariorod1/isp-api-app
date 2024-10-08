import React, { useState } from 'react';
import axios from 'axios';

const IsoUploader = () => {
  const [file, setFile] = useState(null);
  const [iso, setIso] = useState([]); // Estado para guardar las líneas de ISO
  const [responses, setResponses] = useState([]); // Estado para guardar las respuestas
  const [xmls, setXmls] = useState([]); // Estado para almacenar múltiples XML
  const [soapResponses, setSoapResponses] = useState([]); // Estado para almacenar las respuestas SOAP

  // Maneja el cambio de archivo
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();

      // Lee el contenido del archivo cuando esté cargado
      reader.onload = (e) => {
        const text = e.target.result; // Contenido del archivo
        const isos = text.split('\n').filter(line => line.trim() !== ''); // Separar por líneas y remover vacías
        setIso(isos); // Guarda las líneas en el estado
      };

      reader.readAsText(selectedFile); // Lee el archivo como texto
    }
  };

  // Función para hacer el llamado a la API SOAP
  const callSoapApi = async (xml) => {
    try {
      const response = await axios.post('http://soaiisw2k8/IBSOA_CMF_TEST/DisparaTransaccionServicio.svc', xml, {
        headers: {
          'Content-Type': 'text/xml',
          'SOAPAction': 'http://tempuri.org/IDisparaTransaccionServicio/RecuperarDisparaTransaccion' // Ajusta esto según tu servicio
        },
      });

      return response.data; // Devuelve la respuesta de la API SOAP
    } catch (error) {
      console.error('Error al llamar a la API SOAP:', error);
      return { error: error.message }; // Manejo de errores
    }
  };

  // Procesa el archivo y envía a la API
  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file); // Agrega el archivo al FormData

    try {
      const apiResponse = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Importante para enviar archivos
        }
      });

      console.log("Respuesta de la llamada al server del parser: ", apiResponse);
      
      const responses = apiResponse.data.data; // Suponiendo que esto es un arreglo
      setResponses(responses); // Guarda todas las respuestas

      // Crear un objeto de fácil acceso a los campos para cada respuesta
      const newXmls = responses.map(response => {
        const fields = response.fields; // Acceder a los campos de cada respuesta
        console.log("los fields: ", fields);

        // Crear un objeto para cada campo
        const fieldMap = {};
        fields.forEach(field => {
          console.log("cada field: ", field);
          fieldMap[field.label] = field.value.trim(); // Guarda el valor sin espacios en blanco
        });

        // Construir el XML para esta respuesta
        return `
          <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
            <Body>
              <RecuperarDisparaTransaccion xmlns="http://tempuri.org/">
                <CodigoPuesto>${fieldMap['Transaccion']}</CodigoPuesto>
                <Trace>${fieldMap['Trace']}</Trace>
                <MontoTransaccion>${fieldMap['Importe']}</MontoTransaccion>
                <HoraMensaje>${fieldMap['HoraFecLocal']}</HoraMensaje>
                <FechaMensaje>${fieldMap['Fecmsg']}</FechaMensaje>
                <HoraLocalTransaccion>${fieldMap['HoraFecLocal']}</HoraLocalTransaccion>
                <FechaLocalTransaccion>${fieldMap['FechaFecLocal']}</FechaLocalTransaccion>
                <FechaNegocioTransaccionOtraRed>${fieldMap['FechaOtraRed']}</FechaNegocioTransaccionOtraRed>
                <FechaNegocioTransaccion>${fieldMap['FechaFecNegocios']}</FechaNegocioTransaccion>
                <NumeroTarjeta>${fieldMap['Plastico']}</NumeroTarjeta>
                <NumeroComprobante>${fieldMap['Comprobante']}</NumeroComprobante>
                <NumeroTerminal>${fieldMap['TerminalATM']}</NumeroTerminal>
                <CodigoRed>${fieldMap['crd-accpt-id-cde']}</CodigoRed>
                <Propietario>${fieldMap['DatosOrigenTrx']}</Propietario>
                <CuentaHacia>${fieldMap['CuentaHacia']}</CuentaHacia>
                <CotizacionCompra>${fieldMap['Moneda']}</CotizacionCompra>
                <CotizacionVenta>${fieldMap['Moneda']}</CotizacionVenta>
                <RespuestaMensaje>${fieldMap['pin']}</RespuestaMensaje>
                <Adicional2>${fieldMap['add-amts']}</Adicional2>
                <CampoLink42>${fieldMap['add-data-prvt']}</CampoLink42>
                <CampoLink43>${fieldMap['secndry-rsrvd1-iso']}</CampoLink43>
                <CampoLink48>${fieldMap['secndry-rsrvd1-prvt']}</CampoLink48>
                <CampoLink105>${fieldMap['secndry-rsrvd1-prvt'] || ''}</CampoLink105>
                <TareasRealizar>${fieldMap['secndry-rsrvd1-prvt'] || ''}</TareasRealizar>
                <CodigoSucursalSiguiente>${fieldMap['secndry-rsrvd1-prvt']}</CodigoSucursalSiguiente>
                <TipoMensaje>${fieldMap['secndry-rsrvd1-prvt']}</TipoMensaje>
                <CodigoTransacc>${fieldMap['secndry-rsrvd1-prvt']}</CodigoTransacc>
                <CodigoModalidad>${fieldMap['secndry-rsrvd1-prvt']}</CodigoModalidad>
                <TipoTerminal>${fieldMap['secndry-rsrvd1-prvt']}</TipoTerminal>
                <MonedaTransaccion>${fieldMap['Moneda']}</MonedaTransaccion>
                <CodigoOrigenWeb>${fieldMap['secndry-rsrvd1-prvt']}</CodigoOrigenWeb>
                <CampoLink126><![CDATA[${fieldMap['secndry-rsrvd1-prvt'] || ''}]]></CampoLink126>
                <CodigoSucursal>${fieldMap['secndry-rsrvd1-prvt']}</CodigoSucursal>
                <GUID>${fieldMap['secndry-rsrvd1-prvt']}</GUID>
                <IdMensaje>${fieldMap['secndry-rsrvd1-prvt']}</IdMensaje>
                <UsuarioIBS>{{IBSUser}}</UsuarioIBS>
                <UsuarioIBSPass>{{IBSPass}}</UsuarioIBSPass>
              </RecuperarDisparaTransaccion>
            </Body>
          </Envelope>
        `;
      });

      setXmls(newXmls); // Guarda todos los XML generados

      // Llamar a la API SOAP para cada XML generado
      const soapResponses = await Promise.all(newXmls.map(xml => callSoapApi(xml)));
      setSoapResponses(soapResponses); // Guarda las respuestas de la API SOAP

    } catch (error) {
      console.error('Error al llamar a la API:', error);
      setResponses([{ error: error.message }]); // Guarda error
    }
  };

  return (
    <div>
      <h1>Subir Archivo ISO</h1>
      <input type="file" accept=".txt" onChange={handleFileChange} />
      <button onClick={handleUpload}>Subir y Procesar</button>

      {responses.length > 0 && (
        <div>
          <h2>Respuestas de la API:</h2>
          {responses.map((response, index) => (
            <pre key={index}>{JSON.stringify(response, null, 2)}</pre>
          ))}
        </div>
      )}

      {xmls.length > 0 && (
        <div>
          <h2>XMLs Generados:</h2>
          {xmls.map((xml, index) => (
            <pre key={index}>{xml}</pre>
          ))}
        </div>
      )}

      {soapResponses.length > 0 && (
        <div>
          <h2>Respuestas de la API SOAP:</h2>
          {soapResponses.map((response, index) => (
            <pre key={index}>{JSON.stringify(response, null, 2)}</pre>
          ))}
        </div>
      )}
    </div>
  );
};

export default IsoUploader;
