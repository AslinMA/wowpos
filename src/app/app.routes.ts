import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashbordComponent } from './pages/dashbord/dashbord.component';
import { LayoutComponent } from './layout/layout.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { AddItemsComponent } from './pages/add-items/add-items.component';
import { SingupComponent } from './pages/singup/singup.component';
import { RequementListComponent } from './pages/requement-list/requement-list.component';
import { AdminComponent } from './pages/admin/admin.component';
import { SellingComponent } from './pages/selling/selling.component';
import { NotificationComponent } from './pages/notification/notification.component';
import { CartComponent } from './pages/cart/cart.component';
import { SalesReportsComponent } from './pages/sales-reports/sales-reports.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'add-items', component: AddItemsComponent },
      { path: 'admin', component: AdminComponent },
      { path: 'dashbord', component: DashbordComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: '', component: LoginComponent },
      { path: 'login', component: LoginComponent },
      { path: 'requement', component: RequementListComponent },
      { path: 'selling', component: SellingComponent },
      { path: 'singup', component: SingupComponent },
      { path: 'notification', component: NotificationComponent },
      { path: 'cart', component: CartComponent },
      { path: 'sales-reports', component: SalesReportsComponent },
    ]
  }
];
