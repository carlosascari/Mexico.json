const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");

function padz(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

async function Estados() {
  return new Promise((ok, no) => {
    request.get(
      `http://www.microrregiones.gob.mx/catloc/Default.aspx?buscar=1&tipo=nombre&campo=ent&valor=&varent=1`,
      (error, response, data) => {
        if (error) return no(error);
        const $ = cheerio.load(data);
        const trs = $('#GVEnt tbody tr').toArray().slice(1);
        const estados = trs
          .filter(tr => {
            const tds = $(tr).find('td');
            const clave = (+$(tds[0]).text().trim());
            return clave;
          })
          .map(tr => {
          const tds = $(tr).find('td');
          //  0 Clave entidad/estado
          //  1 Nombre de la entidad/estado
          const clave = '' + (+$(tds[0]).text().trim());
          const nombre = $(tds[1]).text().trim();
          return { clave, nombre };
        });
        ok(estados);
      }
    );
  });
}

async function Municipios(claveEstado=1) {
  return new Promise((ok, no) => {
    request.get(
      `http://www.microrregiones.gob.mx/catloc/Default.aspx?tipo=clave&campo=mun&valor=${ padz(claveEstado, 2) }`,
      (error, response, data) => {
        if (error) return no(error);
        const $ = cheerio.load(data);
        const trs = $('#GVMun tbody tr').toArray().slice(1);
        const municipios = trs.map(tr => {
          const tds = $(tr).find('td');
          //  0 Clave entidad/estado
          //  1 Nombre de la entidad/estado
          //  2 Clave del municipio
          //  3 Nombre del municipio
          //  4 Población 2010
          //  5 Grado de marginación del municipio 2010
          //  6 Grado de rezago del municipio 2010
          //  7 25% o más de pob. en PE
          //  8 ZAP rural
          //  9 PDZP
          // 10 CNcH 2013
          // 11 CNcH 2014
          // 12 Porcentaje PHLI > 40%
          const clave = '' + (+$(tds[2]).text().trim());
          const nombre = $(tds[3]).text().trim();
          return { clave, nombre };
        });
        ok(municipios);
      }
    );
  });
}

async function Localidades(claveEstado=1, claveMunicipio=1) {
  return new Promise((ok, no) => {
    request.get(
      `http://www.microrregiones.gob.mx/catloc/LocdeMun.aspx?tipo=clave&campo=loc&ent=${ padz(claveEstado, 2) }&mun=${ padz(claveMunicipio, 3) }`,
      (error, response, data) => {
        if (error) return no(error);
        const $ = cheerio.load(data);
        const trs = $('#GVloc tbody tr').toArray().slice(1);
        const localidades = trs.map(tr => {
          const tds = $(tr).find('td');
          const clave = '' + (+$(tds[4]).text().trim());
          const nombre = $(tds[5]).text().trim();
          return { clave, nombre };
        });
        ok(localidades);
      }
    );
  });
}

async function Actualizar(tabs=2, consoleLog=true) {
  let México, estados, municipios, localidades;

  if (fs.existsSync('Estados.json')) {
    // Conseguir lista de estados
    estados = JSON.parse(fs.readFileSync('Estados.json', 'utf8'));
  } else {
    // Conseguir lista de estados
    estados = await Estados();

    // Crear lista de estados
    fs.writeFileSync('Estados.json', JSON.stringify(estados, null, 2));
  }

  // Crear json de datos completos
  México = estados;

  // Iterar cada estado
  for (let i = 0; i < estados.length; i++) {
    const estado = estados[i];
    if (consoleLog) console.log('Estado: [%d/%d] %s', i + 1, estados.length, estado.nombre);

    // Crear carpeta del estado
    if (!fs.existsSync(estado.nombre)) fs.mkdirSync(estado.nombre);

    if (fs.existsSync(`${ estado.nombre }/Municipios.json`)) {
      // Conseguir lista de municipios del estado
      municipios = JSON.parse(fs.readFileSync(`${ estado.nombre }/Municipios.json`, 'utf8'));
    } else {
      // Conseguir lista de municipios del estado
      municipios = await Municipios(estado.clave);

      // Crear lista de municipios en carpeta del estado
      fs.writeFileSync(`${ estado.nombre }/Municipios.json`, JSON.stringify(municipios, null, 2));
    }

    if (!municipios.length) throw new Error(`No hay Municipios para ${ estado.nombre }`);

    // Crear json de datos completos
    México[i].municipios = municipios;

    // Iterar cada municipio del estado
    for (let j = 0; j < municipios.length; j++) {
      const municipio = municipios[j];
      if (consoleLog) console.log('Municipio: [%d/%d] %s', j + 1, municipios.length, municipio.nombre);

      if (fs.existsSync(`${ estado.nombre }/${ municipio.nombre }.json`)) {
        // Conseguir lista de localidades del municipio
        localidades = JSON.parse(fs.readFileSync(`${ estado.nombre }/${ municipio.nombre }.json`, 'utf8'));
      } else {
        // Conseguir lista de localidades del municipio
        localidades = await Localidades(estado.clave, municipio.clave);

        // Crear lista de localidades del municipio en la carpeta del estado
        fs.writeFileSync(`${ estado.nombre }/${ municipio.nombre }.json`, JSON.stringify(localidades, null, 2));
      }

      if (!localidades.length) throw new Error(`No hay Localidades para ${ municipio.nombre }, ${ estado.nombre }`);
      if (consoleLog) console.log('... %d localidades.', localidades.length);

      // Crear json de datos completos
      México[i].municipios[j].localidades = localidades;
    }
  };

  // Crear lista completa
  fs.writeFileSync(`México.json`, JSON.stringify(México, null, tabs));
}

if (require.main === module) {
  Actualizar();
} else {
  module.exports = {
    Estados,
    Municipios,
    Localidades,
    Actualizar,
  };
  if (fs.existsSync('México.json')) {
    module.exports['México'] = JSON.parse(fs.readFileSync('México.json', 'utf8'));
    module.exports['Mexico'] = module.exports['México'];
  }
}