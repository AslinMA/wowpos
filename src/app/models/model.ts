export class Model {
    constructor(
        public id: number | null,
        public brand: string,
        public modelName: string,
        public category: string,
        public createdAt?: string
    ) {}
}
