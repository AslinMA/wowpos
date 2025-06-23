import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { addItems } from '../../models/addItems';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-items',
  imports: [FormsModule,HttpClientModule ],
  templateUrl: './add-items.component.html',
  styleUrl: './add-items.component.css'
})
export class AddItemsComponent {

 public items: addItems = new addItems(0,"", "", "", "", "", "", "", "")

  constructor(private http: HttpClient) { }

  addItems() {
   // alert(this.items.brand);
    if (
    !this.items.date ||
    !this.items.category ||
    !this.items.brand ||
    !this.items.model ||
    !this.items.quantity ||
    !this.items.buyPrice ||
    !this.items.sellPrice ||
    !this.items.location
  ) {
    alert("Please fill in all fields before submitting.");
    return; // stop submission
  }
  
    this.http.post("http://localhost:8080/product", this.items).subscribe(res => {
      alert("your Item Was Added...!");
      this.items = new addItems(0,"", "", "", "", "", "", "", "");
    })
  }
}

