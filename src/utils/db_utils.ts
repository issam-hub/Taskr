import { loadEnvFile } from "process";
import { DataSource } from "typeorm";
import { Roles } from "../components/roles/entity.js";
import { Users } from "../components/users/entity.js";
import { Projects } from "../components/projects/entity.js";
import { Comments } from "../components/comments/entity.js";
import { Tasks } from "../components/tasks/entity.js";

export class ConnectDatabase{
    constructor(){
        this.connect();
    }

    private connect(){
        try{
            loadEnvFile();
            const {HOST, DBPORT, USERNAME, PASSWORD, DBNAME} = process.env;
            const appDataSource = new DataSource({
                type: 'postgres',
                host: HOST as string,
                port: DBPORT as unknown as number,
                username: USERNAME as string,
                password: PASSWORD as string,
                database: DBNAME as string,
                entities: [Roles, Users, Projects, Comments, Tasks],
                synchronize: true,
                logging: false,
            });
            appDataSource.initialize()
            .then(()=>{
                console.log(`connected to database at port :${DBPORT}`);
            }).catch((err)=>console.error(err))
        }catch(err){
            console.error('error connecting to database: ', err);
        }
    }
}