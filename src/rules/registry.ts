import type {ModifierProvider} from "./provider"; export class ModifierRegistry{private p:ModifierProvider[]=[];register(x:ModifierProvider){this.p.push(x);}getProviders(){return [...this.p];}}
