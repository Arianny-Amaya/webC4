import { authenticate } from '@loopback/authentication';
import { service } from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {Credenciales, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import { AutenticacionService } from '../services';
const fetch = require('node-fetch');      //7. despues de istalado el paquete se importa

//aqui si deseo inyectar todos los permisos de rol @authenticate('admin')
export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository : UsuarioRepository,
    @service(AutenticacionService)                       //3. inyectamos el servicio AutenticacionServices para poder llamar los metodos desde aqui
    public servicioAutenticacion: AutenticacionService    // se coloca un servicio
  ) {}
  
  //en caso de saltar un modulo @authenticate.skip()
  @post('/identificarUsuario', {       //ac 11 creamos una nueva ruta
    responses:{
      '200':{
        description: 'Identificacion de ususarios'
      } 
    }
  })
  async identificarUsuario(
  @requestBody() credenciales : Credenciales         //despues de creado el model, se importa como aparece en la linea 21 
  ){
    let p = await this.servicioAutenticacion.IdentificarUsuario(credenciales.usuario, credenciales.contrasena);
    if(p){
      let token = this.servicioAutenticacion.GenerarTokenJWT(p);
      return{
        datos:{
          nombre: p.nombre,
          correo: p.correo,
          id: p.id
        },
        tk: token 
      }
    }else{
      throw new HttpErrors[401]('Datos invalidos');
    }
  }

  //@authenticate('admin')      //at4 aqui inyectamos la parte del rol, donde solo el administrador tiene derecho a crear un usuario
  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario> {
    let contrasena = this.servicioAutenticacion.GenerarContrasena();                    //4. definir contrasena
    let contrasenaCifrada = this.servicioAutenticacion.CifrarContrasena(contrasena);    //5.  devuelve contrasena cifrada   
    usuario.contrasena = contrasenaCifrada;                                             //6.  a usuario asigno contrasena cifrada
    let p = await this.usuarioRepository.create(usuario);                              //0. como se hace una funcion asincrona, entonces se hace esperar. Es modificada la que esta debajo por ésta.
    //return this.usuarioRepository.create(usuario);                                   y se intala unm paquete (crypto -js : encriptado de las claves) y el password -generator: genera las claves). En services/autentication.service.ts
                                                                        
    //8.  Notificar al usuario  (abrir anaconda-spider)
    let correo_destino = usuario.correo;
    let asunto = 'Datos de registro en la paltaforma0';
    let contenido = `Hola ${usuario.nombre} bienvenido a la plataforma de macotas, su usuario es ${usuario.correo} y su contraseña es ${contrasena}`
    fetch(`http://127.0.0.1:5000/email?correo_destino=${correo_destino}&asunto=${asunto}&contenido=${contenido}`)       // par su funcion se debe instalar paquete node-fetch 
      .then((data:any)=>{                                                                                               // que permite llamado de url externas, para que co nsuma un servicio en el otro servidor
        console.log(data);                                                                                              // que fue creado con Spyder(servicio de correo)
      })
      return p;
  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }
}
