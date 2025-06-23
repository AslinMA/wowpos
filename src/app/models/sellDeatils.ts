export class sellDeatils {
    name: string;
    phoneNumber: string;
    id: number;
    date: string;
    category: string;
    brand: string;
    model: string;
    quantity: number;
    discountedPrice: number;
    sellPrice: string;
    transactionId: string

    constructor(
        id: number,
        name: string,
        phoneNumber: string,
        date: string,
        category: string,
        brand: string,
        model: string,
        quantity: number,
        discountedPrice: number,
        sellPrice: string,
        transactionId:string
    ) {
        this.id = id;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.date = date;
        this.category = category;
        this.brand = brand;
        this.model = model;
        this.quantity = quantity;
        this.discountedPrice = discountedPrice;
        this.sellPrice = sellPrice;
       this.transactionId=transactionId;
    }
}