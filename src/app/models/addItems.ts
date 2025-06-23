export class addItems {
    id:number;
    date: string;
    category: string;
    brand: string;
    model: string;
    quantity: string;
    buyPrice: string;
    sellPrice: string;
    location: string;

    constructor(
        id:number,
        date: string,
        category: string,
        brand: string,
        model: string,
        quantity: string,
        buyPrice: string,
        sellPrice: string,
        location: string
    ) {
        this.id=id;
        this.date = date;
        this.category = category;
        this.brand = brand;
        this.model = model;
        this.quantity = quantity;
        this.buyPrice = buyPrice;
        this.sellPrice = sellPrice;
        this.location = location;
    }
    
}