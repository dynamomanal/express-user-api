export interface User {
    id:number;
    name:string;
    email:string;
}

export const mockUsers:Record<number,User>={
    1:{id:1.,name:"Alice",email:"alice@gmail.com"},
    2:{id:2.,name:"Bob",email:"bob123@gmail.com"},
    3:{id:3.,name:"Charlie",email:"charlieharlie@gmail.com"}
}


