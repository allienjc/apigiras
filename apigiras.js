const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
var fs = require("fs");
const { throws } = require("assert");
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: "temp",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
app.use(
  multer({
    storage,
  }).single("file")
);

var conexion = mysql.createConnection({
  host: "mysql-apigiras.alwaysdata.net",
  user: "apigiras",
  password: "Juan1985!",
  database: "apigiras_giras",
});

conexion.connect(function(error) {
  if (error) {
    throw error;
  } else {
    console.log("conexion exitosa");
  }
});

//ROUTES
app.get("/", function(req, res) {
  res.send("Hello World");
});

app.post("/login", function(req, res) {
  console.log("tratando de logearse")
  let user = req.body.user;
  let pass = req.body.pass;
  conexion.query(
    'SELECT * FROM usuarios WHERE matricula = ? AND pass = ? AND estatus = "ACTIVO"',
    [user, pass],
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});
//USUARIOS**********************
app.get("/obtener_usuarios", (req, res) => {
  conexion.query(
    'SELECT * FROM usuarios WHERE estatus = "ACTIVO"',
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});

app.get("/obtener_usuario_changepass", (req, res) => {
  let id = parseInt(req.query.id);
  conexion.query(
    "SELECT * FROM usuarios WHERE usuario_id = ?",
    [id],
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});

app.put("/changepass", (req, res) => {
  let pass = req.body.newpass;
  let id = req.body.id;
  conexion.query(
    "UPDATE usuarios SET pass = ? WHERE usuario_id = ?",
    [pass, id],
    function(error, results, fields) {
      if (error) {
        throw error;
      } else {
        res.send("OK");
      }
    }
  );
});

app.post("/agregar_usuario", (req, res) => {
  let datos = {
    nombre_usuario: req.body.nombre_usuario,
    correo_usuario: req.body.correo_usuario,
    tipo_usuario: "ADMIN",
    matricula: req.body.matricula,
    pass: req.body.pass,
    estatus: "ACTIVO",
    unidades_permitidas:req.body.unidades_permitidas,
  };
  conexion.query("INSERT INTO usuarios SET ?", datos, function(
    error,
    results,
    fields
  ) {
    if (error) {
      throw error;
    } else {
      res.send("OK");
    }
  });
});

app.put("/editar_usuario", (req, res) => {
  const id = req.body.usuario_id;
  const nombre_usuario = req.body.nombre_usuario;
  const correo_usuario = req.body.correo_usuario;
  const unidades_permitidas = req.body.unidades_permitidas;
  const matricula = req.body.matricula;

  console.log(req.body);
  conexion.query(
    "UPDATE usuarios SET nombre_usuario = ?, correo_usuario = ?, matricula = ?, unidades_permitidas = ?  WHERE usuario_id = ?",
    [nombre_usuario, correo_usuario, matricula,unidades_permitidas, id],
    function(error, results, fields) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("OK");
      }
    }
  );
});

app.put("/eliminar_usuario", (req, res) => {
  const id = req.body.id;
  conexion.query(
    "UPDATE usuarios SET estatus = 'ELIMINADO'  WHERE usuario_id = ?",
    [id],
    function(error, results, fields) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("OK");
      }
    }
  );
});

//MINUTAS *******************
app.get("/minutas", (req, res) => {
  let id = req.query.id;
  conexion.query(
    'SELECT * FROM minutas WHERE estatus = "activo"',
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});

app.put("/lugar", (req, res) => {
  let id = req.body.id_minuta;
  let lugar = req.body.lugar;
  conexion.query(
    "UPDATE minutas set lugar = ? where minuta_id = ?",
    [lugar, id],
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});

app.get("/obtener_lugar", (req, res) => {
  let id = req.query.id_minuta;
  conexion.query(
    "SELECT lugar FROM minutas WHERE minuta_id = ?",
    id,
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});

app.post("/agregar_minuta", (req, res) => {
  let datos = {
    nombre_minuta: req.body.nombre_minuta,
    fecha_creacion: req.body.fecha_creacion,
    id_areas: req.body.id_areas,
    id_usuario: req.body.id_usuario,
    estatus: req.body.estatus,
    tipo: req.body.tipo,
    area_creadora: req.body.area_creadora,
    ubicacion: req.body.ubicacion,
  };
  conexion.query("INSERT INTO minutas SET ?", datos, function(
    error,
    results,
    fields
  ) {
    if (error) {
      throw error;
    } else {
      if (datos.tipo == "PERSONAL") {
        conexion.query(
          "select minuta_id from minutas order by minuta_id desc limit 1",
          function(error2, fila) {
            if (error2) {
              throw error2;
            } else {
              console.log(fila[0].minuta_id);
              let datos_participantes = {
                minuta_id: fila[0].minuta_id,
                participantes: req.body.participantes_string,
                convocante: req.body.convocante,
              };
              conexion.query(
                "INSERT INTO participantes SET ?",
                datos_participantes,
                function(error3, results) {
                  if (error3) {
                    throw error3;
                  }
                }
              );
            }
          }
        );
      }
      res.send(datos);
    }
  });
});

app.put("/editar_minuta", (req, res) => {
  const id = req.body.id_minuta;
  const nombre_minuta = req.body.nombre_minuta;
  const tipo = req.body.tipo;
  const ubicacion = req.body.ubicacion;
  let area_creadora = req.body.area_creadora;

  conexion.query(
    "UPDATE minutas SET nombre_minuta = ?, tipo = ?, area_creadora = ?, ubicacion = ? WHERE minuta_id = ?",
    [nombre_minuta, tipo, area_creadora, ubicacion, id],
    function(error, results, fields) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("MINUTA EDITADA");
      }
    }
  );
});

app.put("/eliminar_minuta", (req, res) => {
  const id = req.body.id;
  conexion.query(
    "UPDATE minutas SET estatus = 'ELIMINADO' WHERE minuta_id = ?",
    id,
    function(error, results, fields) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("MINUTA ELIMINADA");
      }
    }
  );
});

app.get("/obtener_cuerpo", (req, res) => {
  conexion.query(
    'SELECT * FROM areas and estatus = "ACTIVO"',
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});

app.post("/agregar_area_gobierno", (req, res) => {
  let datos = {
    nombre_area: req.body.nombre_area,
    grupo: req.body.grupo,
    encargado: req.body.encargado,
    estatus: "ACTIVO",
  };
  conexion.query("INSERT INTO areas SET ?", datos, function(
    error,
    results,
    fields
  ) {
    if (error) {
      throw error;
    } else {
      res.send(datos);
    }
  });
});

app.put("/editar_cuerpo", (req, res) => {
  const id = req.body.area_id;
  const nombre_area = req.body.nombre_area;
  const encargado = req.body.encargado;
  conexion.query(
    "UPDATE areas SET nombre_area = ?, encargado = ? WHERE area_id = ?",
    [nombre_area, encargado, id],
    function(error, results, fields) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("AREA EDITADA");
      }
    }
  );
});

app.put("/eliminar_cuerpo", (req, res) => {
  const id = req.body.id;
  conexion.query(
    "UPDATE areas SET ESTATUS = 'ELIMINADO' WHERE area_id = ?",
    [id],
    function(error, results, fields) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("AREA EDITADA");
      }
    }
  );
});

app.get("/obtener_participantes", (req, res) => {
  const id = req.query.minuta_id;
  console.log(id);
  conexion.query(
    "SELECT * FROM participantes WHERE minuta_id = ?",
    [id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send(filas);
      }
    }
  );
});

app.post("/add_participantes", (req, res) => {
  let datos = {
    minuta_id: req.body.id_minuta,
    participantes: req.body.participantes_cadena,
    convocante: req.body.convocante,
  };
  conexion.query(
    "SELECT * FROM participantes WHERE minuta_id = ?",
    datos.minuta_id,
    function(error1, filas1) {
      if (error1) {
        throw error1;
      } else {
        if (filas1.length < 1) {
          conexion.query("INSERT INTO participantes SET ?", datos, function(
            error,
            filas
          ) {
            if (error) {
              throw error;
            } else {
              res.status(200).send("INSERTADO CON EXITO");
            }
          });
        } else {
          conexion.query(
            "UPDATE participantes SET participantes = ?, convocante = ? WHERE minuta_id = ?",
            [datos.participantes, datos.convocante, datos.minuta_id],
            function(error3, filas3) {
              if (error3) {
                throw error3;
              } else {
                res.status(200).send("EDITADO CON EXITO");
              }
            }
          );
        }
      }
    }
  );
});

app.get("/obtener_idareas", (req, res) => {
  const id = req.query.id;
  conexion.query("SELECT * FROM minutas WHERE minuta_id = ?", [id], function(
    error,
    filas
  ) {
    if (error) {
      throw error;
    } else {
      res.status(200).send(filas);
    }
  });
});

app.get("/obtener_areas", (req, res) => {
  conexion.query('SELECT * FROM areas WHERE estatus = "ACTIVO"', function(
    error,
    filas
  ) {
    if (error) {
      throw error;
    } else {
      res.status(200).send(filas);
    }
  });
});

app.get("/autocomplete", (req, res) => {
  conexion.query(
    'SELECT * from responsables WHERE estatus_responsable = "ACTIVO" ORDER BY id_responsable DESC',
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send(filas);
      }
    }
  );
});

app.post("/agregar_responsable", (req, res) => {
  let datos = {
    nombre_responsable: req.body.nombre_responsable,
    area_responsable: req.body.area_responsable,
    estatus_responsable: "ACTIVO",
  };
  conexion.query("INSERT INTO responsables SET ?", datos, function(
    error,
    filas
  ) {
    if (error) {
      throw error;
    } else {
      res.status(200).send("AGREGADO");
    }
  });
});

app.get("/obtener_asuntos_todos", (req, res) => {
  const id = req.query.id;
  conexion.query(
    'SELECT * FROM asuntos WHERE  minuta_id = ? AND concluido != "eliminado" ORDER BY asunto_id',
    [id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send(filas);
      }
    }
  );
});

app.get("/obtener_asuntos", (req, res) => {
  let area_id = req.query.id_area;
  let minuta_id = req.query.id_minuta;
  let opcion = req.query.opcion;
  if (opcion != "ultimo") {
    conexion.query(
      "SELECT * FROM asuntos WHERE minuta_id = ? ORDER BY asunto_id desc",
      [minuta_id],
      function(error, filas) {
        if (error) {
          throw error;
        } else {
          console.log(filas);
          res.status(200).send(filas);
        }
      }
    );
  } else {
    conexion.query(
      "SELECT * FROM asuntos WHERE area_id = ? AND minuta_id = ? ORDER BY asunto_id desc limit 1",
      [area_id, minuta_id],
      function(error, filas) {
        if (error) {
          throw error;
        } else {
          res.status(200).send(filas);
        }
      }
    );
  }
});

app.put("/agregar_area", (req, res) => {
  let id_areas = req.body.id_areas;
  let minuta_id = req.body.minuta_id;
  conexion.query(
    "UPDATE minutas SET id_areas = ? WHERE minuta_id = ?",
    [id_areas, minuta_id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("ok");
      }
    }
  );
});

app.put("/eliminar_area", (req, res) => {
  let id_areas = req.body.id_areas;
  let minuta_id = req.body.minuta_id;
  let area_id = req.body.area_id;
  conexion.query(
    'UPDATE asuntos SET concluido = "eliminado" where minuta_id = ? AND area_id  = ?',
    [minuta_id, area_id]
  ),
    function(error, filas) {
      if (error) {
        throw error;
      }
    };
  conexion.query(
    "UPDATE minutas SET id_areas = ? WHERE minuta_id = ?",
    [id_areas, minuta_id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("ok");
      }
    }
  );
});

app.post("/agregar_asunto", (req, res) => {
  let datos = {
    asunto: req.body.asunto,
    observaciones: req.body.observaciones,
    compromiso: req.body.compromiso,
    fecha_asunto: new Date(),
    concluido: 0,
    minuta_id: req.body.id_minuta,
    fecha_cumplimiento: req.body.fecha_cumplimiento,
    responsable: req.body.responsable,
  };
  conexion.query("INSERT INTO asuntos SET ?", datos, function(error, filas) {
    if (error) {
      throw error;
    } else {
      res.status(200).send("Nuevo Asunto Insertado");
    }
  });
});

app.post("/obtener_asunto", (req, res) => {
  let id = req.body.idAsunto;
  console.log(id);
  conexion.query("SELECT * FROM asuntos WHERE asunto_id = ?", [id], function(
    error,
    filas
  ) {
    if (error) {
      throw error;
    } else {
      res.status(200).send(filas);
    }
  });
});

app.put("/editar_asunto", (req, res) => {
  let id = req.body.editarAsuntoId,
    asunto = req.body.asunto,
    observaciones = req.body.observaciones,
    compromiso = req.body.compromiso,
    responsable = req.body.responsable,
    fecha_cumplimiento = req.body.fecha_cumplimiento,
    concluido = 0,
    minuta_id = req.body.id_minuta;

  conexion.query(
    "UPDATE asuntos SET asunto = ?, observaciones = ?, compromiso = ?, responsable = ?, fecha_cumplimiento = ? WHERE asunto_id = ?",
    [asunto, observaciones, compromiso, responsable, fecha_cumplimiento, id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send(filas);
      }
    }
  );
});

app.put("/eliminar_asunto", (req, res) => {
  let id = req.body.id;
  conexion.query(
    'UPDATE asuntos SET concluido = "eliminado" WHERE asunto_id = ?',
    [id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("eliminado");
      }
    }
  );
});

// AVANCES
app.get("/obtener_avances", (req, res) => {
  const id_minuta = req.query.id_minuta;
  const asunto_id = req.query.asunto_id;
  const anio = req.query.anio;
  const mes = req.query.mes;
  let fecha_inicial = anio + "-" + mes + "-" + 1;
  let ultimo_dia = new Date(anio, mes, 0).getDate();
  let fecha_final = anio + "-" + mes + "-" + ultimo_dia;
  conexion.query(
    'SELECT * FROM avances WHERE  minuta_id = ?  AND asunto_id = ? AND estatus != "eliminado"',
    [id_minuta, asunto_id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        for (i = 0; i < filas.length; i++) {
          if (filas[i].archivos == "si") {
            var archivos2 = fs.readdirSync(
              `uploads/${filas[i].minuta_id}/${filas[i].avance_id}`
            );
            filas[i].archivos = archivos2;
          }
        }
        res.status(200).send(filas);
      }
    }
  );
});

app.post("/asistencia", (req, res) => {
  let minuta_id = req.body.minuta_id;
  let dir = `uploads/listas/${minuta_id}/`;
  if (fs.existsSync(dir)) {
    var listas = fs
      .readdirSync(`uploads/listas/${minuta_id}`)
      .map(function(v) {
        return { name: v, time: fs.statSync(dir + v).mtime.getTime() };
      })
      .sort(function(a, b) {
        return a.time - b.time;
      })
      .map(function(v) {
        return v.name;
      });

    res.send(listas);
  } else {
    res.send("no existe");
  }
});

app.get("/obtener_avancespdf", (req, res) => {
  const id_minuta = req.query.id_minuta;
  const anio = req.query.anio;
  const mes = req.query.mes;
  let fecha_inicial = anio + "-" + mes + "-" + 1;
  let ultimo_dia = new Date(anio, mes, 0).getDate();
  let fecha_final = anio + "-" + mes + "-" + ultimo_dia;
  conexion.query(
    'SELECT * FROM avances WHERE  minuta_id = ?  AND estatus != "eliminado" AND avance_fecha BETWEEN ? AND ?',
    [id_minuta, fecha_inicial, fecha_final],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send(filas);
      }
    }
  );
});

app.post("/agregar_avance", (req, res) => {
  let datos = {
    avance: req.body.avance,
    avance_fecha: new Date(),
    minuta_id: req.body.minuta_id,
    asunto_id: req.body.asunto_id,
    estatus: "activo",
  };
  conexion.query("INSERT INTO avances SET ?", datos, function(error, filas) {
    if (error) {
      throw error;
    } else {
      res.status(200).send(filas);
    }
  });
});

app.put("/editar_avance", (req, res) => {
  let avance_id = req.body.avance_id;
  let avance = req.body.avance;
  conexion.query(
    "UPDATE avances SET avance = ? WHERE avance_id = ?",
    [avance, avance_id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("editado");
      }
    }
  );
});

app.put("/eliminar_avance", (req, res) => {
  let avance_id = req.body.avance_id;
  conexion.query(
    'UPDATE avances SET estatus = "eliminado" WHERE avance_id = ?',
    [avance_id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("eliminado");
      }
    }
  );
});

//SECCION DE COMENTARIOS
app.get("/obtener_comentarios", (req, res) => {
  
  const avance_id = req.query.avance_id;
  
  conexion.query(
    'SELECT * FROM comentarios WHERE avance_id = ?',
    [avance_id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        
        res.status(200).send(filas);
      }
    }
  );
});

app.post("/agregar_comentario", function(req, res, next) {
let datos = {
avance_id : req.body.avance_id,
comentario : req.body.comentario,
usuario_comentario : req.body.usuario_comentario
}
conexion.query("insert into comentarios set ?", datos, function(error){
if (error){
  throw error
}
else{
  conexion.query("SELECT * FROM comentarios WHERE avance_id = ?", datos.avance_id, function(error,filas){
    if(error){
      throw error
    }
    else{
      res.status(200).send(filas);
    }
  })
}

})
});


app.put("/concluir_asunto", (req, res) => {
  let asunto_id = req.body.asunto_id;
  conexion.query(
    'UPDATE asuntos SET concluido = "concluido" WHERE asunto_id = ?',
    [asunto_id],
    function(error, filas) {
      if (error) {
        throw error;
      } else {
        res.status(200).send("concluido");
      }
    }
  );
});

app.post("/subir_archivo", function(req, res, next) {
  let id = req.body.id;
  let minuta_id = req.body.minuta_id;
  let dir = `uploads/${minuta_id}`;
  if (!fs.existsSync(dir)) {
    console.log("creando directorio");
    fs.mkdirSync(dir);
  }
  if (!fs.existsSync(dir + "/" + id)) {
    fs.mkdirSync(dir + "/" + id);
  }
  fs.renameSync(
    `temp/${req.file.originalname}`,
    `uploads/${minuta_id}/${id}/${req.file.originalname}`
  );
  conexion.query(
    "UPDATE avances SET archivos = 'si' WHERE avance_id = ?",
    [id],
    function(error, filas) {
      if (error) {
        throw error;
      }
    }
  );
  return res.status(200).send(req.file);
});

//SE TIENE QUE CREAR MANUALMENTE LA CARPETA DE LISTAS
app.post("/subir_lista", function(req, res, next) {
  let minuta_id = req.body.minuta_id;
  let dir = `uploads/listas/${minuta_id}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.renameSync(
    `temp/${req.file.originalname}`,
    `uploads/listas/${minuta_id}/${req.file.originalname}`
  );
  res.status(200).send();
});

app.get("/download/:minuta_id/:id/:nombre", (req, res) => {
  let file =
    __dirname +
    "/uploads/" +
    req.params.minuta_id +
    "/" +
    req.params.id +
    "/" +
    req.params.nombre;
  res.download(file);
});
app.get("/download2/:minuta_id/:nombre", (req, res) => {
  let file =
    __dirname +
    "/uploads/listas/" +
    req.params.minuta_id +
    "/" +
    "/" +
    req.params.nombre;
  res.download(file);
});

app.listen(8000, () => {
  console.log("ok");
});
