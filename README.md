# [México.json]()

> Todas las Localidades de todos los Municipios de todos los Estados de México, en un JSON.

El proposito de este projecto es para tener los datos necesario para permitir crear una experiencia de usario superior cuando se le pide selecionar datos sobre una ubicacion en Mexico.

Con los datos siguientes, pueden evitar excribir el nombre de su localidad (colonia, rancho, ciudad, etc). La idea es poder selecionar un Municipio y de ahi selecionar la localidad adentro del Municipio.

**México.json** es un archivo con el siguiente formato:

```javascript
[
  { clave, nombre, municipios: [...] }, // Estados
  { clave, nombre, municipios: [...] },
  { clave, nombre, municipios: [...] },
  {
    clave, 
    nombre, 
    municipios: [
      { clave, nombre, localidades: [...] }, // Municipios del Estado
      { clave, nombre, localidades: [...] },
      { clave, nombre, localidades: [...] },
      {
        clave,
        nombre,
        localidades: [
          { clave, nombre }, // Localidades del Municipio
          { clave, nombre },
          { clave, nombre },
        ]
      },
    ]
  },
]
```

Cada elemento tiene 2 propiedades comunes: 

- *String* **clave** 
  La clave que usa SEDESOL para identificar el estado, municipio o localidad.
- *String* **nombre** 
  El nombre del estado, municipio o localidad.

**Ojo**

- Varias localidades no tienen nombre, asi que su nombre es "Ninguno".
- La propiedad **nombre**, puede contenter extra datos que viene adentro de un parentesis o un braquet.
   - `(...)` Otro nombre. Si el nombre tiene un parentesis, el dato adentro del parentesis representa otro nombre para la misma localidad.
   - `[...]` Tipo de localidad o descripcion. Si el nombre tiene un braquet, el dato adentro del braquet puede ser el tipo de localidad (Rancho, Colonia, etc) o una descripcion del uso de la localidad (Centro de Readaptación de Mínima Seguridad, Centro Deportivo, etc).

Pudes usar el siguiente codigo para detectar un parentesis o braquet, y usar el Regex para separarlos.

```javascript
let nombre, nombre2, descripcion, tmp;

if (localidad.nombre.indexOf('(') != -1) {
  tmp = /(.+) \((.+)\)/.exec(localidad.nombre);
  nombre = tmp[1];
  descripcion = tmp[2];
} else if (localidad.nombre.indexOf('[') != -1) {
  tmp = /(.+) \[(.+)\]/.exec(localidad.nombre);
  nombre = tmp[1];
  descripcion = tmp[2];
} else {
  nombre = localidad.nombre;
}
```

## Uso

El codigo siguiente muestra como puedes iterar cada elemento del JSON.

De esta forma puedes manipular los datos.

```javascript
const México = JSON.parse(fs.readFileSync('./México.json'));

for (let i = 0; i < México.length; i++) {
  const estado = México[i];
  for (let j = 0; j < estado.municipios.length; j++) {
    const municipio = estado.municipios[j];
    for (let k = 0; k < municipio.localidades.length; k++) {
      const localidad = municipio.localidades[k];
      // ...
    }
  }
}
```

### Ejemplos

**Imprime todos los datos**

```javascript
const México = JSON.parse(fs.readFileSync('./México.json'));

for (let i = 0; i < México.length; i++) {
  const estado = México[i];
  console.log('%s', estado.nombre);
  for (let j = 0; j < estado.municipios.length; j++) {
    const municipio = estado.municipios[j];
    console.log('  %s', municipio.nombre);
    for (let k = 0; k < municipio.localidades.length; k++) {
      const localidad = municipio.localidades[k];
      console.log('    %s', localidad.nombre);
    }
  }
}
```

**Elimina las localidades sin nombre**

```javascript
const México = JSON.parse(fs.readFileSync('./México.json'));

for (let i = 0; i < México.length; i++) {
  const estado = México[i];
  for (let j = 0; j < estado.municipios.length; j++) {
    const municipio = estado.municipios[j];
    for (let k = 0; k < municipio.localidades.length; k++) {
      const localidad = municipio.localidades[k];
      let nombre, descripcion, tmp;
      if (localidad.nombre.indexOf('[') != -1) {
        tmp = /(.+) \[(.+)\]/.exec(localidad.nombre);
        nombre = tmp[1];
        descripcion = tmp[2];
      } else {
        nombre = localidad.nombre;
      }
      if (nombre == 'Ninguno') {
        delete municipio.localidades[k];
      }
    }
  }
}
```

**Simplificar nombre de estados**

Yo no conozco alguien que se refiera a `Veracruz de Ignacio de la Llave`, generalmente lo conocemos como `Veracruz`.

```javascript
const México = JSON.parse(fs.readFileSync('./México.json'));

for (let i = 0; i < México.length; i++) {
  const estado = México[i];
  estado.nombre = estado.nombre.split(' de ')[0];
}
```
