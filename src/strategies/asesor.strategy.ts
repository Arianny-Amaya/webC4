import { AuthenticationStrategy } from "@loopback/authentication";
import { service } from "@loopback/core";
import { HttpErrors } from "@loopback/rest";
import { UserProfile } from "@loopback/security";
import parseBearerToken from "parse-bearer-token";
import { AutenticacionService } from "../services";
import {Request} from 'express';


export class EstrategiaAsesor implements AuthenticationStrategy{ //at2 EstrategiaAsesor la registramos en la
    name: string = 'asesor';                                             // src/application, dentro del constructor};

    constructor(
        @service(AutenticacionService)
        public servicioAutenticacion : AutenticacionService
    ){}

    async authenticate(request: Request): Promise<UserProfile | undefined> {
        let token =  parseBearerToken(request);                  //at1 instalamos parse-bearer-token para colocar parseBearerToken
        if(token){
            let datos = this.servicioAutenticacion.ValidarTokenJWT(token)
            // aqui se haria la validacion dependiendo del rol
            if(datos){
                let perfil: UserProfile = Object.assign({
                    nombre: datos.data.nombre
                });
                return perfil;
            }else{
                throw new HttpErrors[401]('El token estaba malo')
            }
        }else{
            throw new HttpErrors[401]('No se incluyo token')
        }
    }   
}