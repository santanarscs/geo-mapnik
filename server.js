const express = require('express')
const mapnik = require('mapnik');
const app = express();

mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

const proj4 =
  '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs';


const createVectorTile = (sql,{ x, y, z }) => {
  const dbConfig = {
    host: 'localhost',
    dbname: 'docker',
    user: 'docker',
    password: 'docker',
    type: 'postgis',
    table: `(${sql}) as tile`,
  };
  const map = new mapnik.Map(256, 256, proj4);
  let layer = new mapnik.Layer('tile', proj4);
  layer.datasource = new mapnik.Datasource(
    dbConfig
  );
  map.add_layer(layer);
  const vector = new mapnik.VectorTile(
    z, x, y
  );

  return new Promise((res, rej) => {
    map.render(vector, (err, vectorTile) => {
      if (err) return rej(err);
      vectorTile.getData((err, buffer) => {
        if (err) return rej(err);
        return res(buffer);
      });
    });
  });
}

app.get('/', (request, response) => {
  return response.json({ok: true})
})

app.get('/:x/:y/:z.mvt', async (req, res) => {
  const { x, y, z} = req.params;
  const data = {
    x: Number(x),
    y: Number(y),
    z: Number(z)
  };
  const sql = 'select geom from infras2'
  const tile = await createVectorTile(
    sql,
    data
  )
  console.log(tile)
  res.setHeader(
    'Content-Type',
    'application/x-protobuf'
  );
  res.status(200);
  res.send(tile);
})

app.listen(3000, () => {
  console.log('App online')
})