import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import { repository } from '@loopback/repository';
import { Usuario } from '../models';
import { UsuarioRepository } from '../repositories';
import { Llaves } from '../config/llaves';        //ac8 importamos para usar la linea 58.

const generador = require('password-generator');  //1. instalado los paquetes (aqui), importamos  
const cryptoJS = require('crypto-js');            //
const jwt = require('jsonwebtoken');              //ac4

@injectable({scope: BindingScope.TRANSIENT})
export class AutenticacionService {
  constructor(@repository(UsuarioRepository)     //ac1 cuando seleccionnamos UsusarioRepository, automaticamente se inserta el codg. linea 3
  public usuarioRepository : UsuarioRepository   //
  ) {}

  
  /*
   * Add service methods here
   */
 
 
  //2. se crean dos metodos (generar y cifrar contraseña)
  GenerarContrasena(){        //genera
    let contrasena = generador(8,false);
    return contrasena;
  }

  CifrarContrasena(contrasena:string){    //asigna
    let contrasenaCifrada = cryptoJS.MD5(contrasena).toString();  //MD5 metodo descifrado
    return contrasenaCifrada;
  }

  IdentificarUsuario(usuario: string, contrasena: string ){    // ac2 para conectar con el Login
    try{
      let p = this.usuarioRepository.findOne({where: {correo: usuario, contrasena: contrasena}}); //si encuentra en al tabla? retorna p-persona(todo registro)
      if(p){
        return p;
      }
      return false;

    }catch{
      return false;
    }
  }                                                             //..

  /*metodo, ayuda autenticar usuario,éste utiliza  el jsonwebtoken   ya instalado            ac3
  se le envian dos parametros data(objeto) y llaves.
  */
  GenerarTokenJWT(usuario: Usuario){                        //ac5 seguridad
    let token = jwt.sing({                                  //2 parametros (data y Llaves)
      data: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre
      }
    },
    Llaves.contrasenaJWT);                                   //ac9 crea la llave con el token que le demos
    return token;                                            //
  }

  ValidarTokenJWT(token: string){                            //ac10 recibe el token
    try{
      let datos = jwt.verify(token, Llaves.contrasenaJWT);   //para verificacion envio token y llave
      return datos;
    }catch{
      return false;
    }
  }

}
