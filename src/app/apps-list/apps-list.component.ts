import { Component, Input, OnInit } from '@angular/core';
import { Producer } from "../producer";
import { Application } from '../application';
import { AngularFireDatabase } from '@angular/fire/database';

import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormBuilder, FormGroup } from '@angular/forms';

import { DataService } from '../data.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-apps-list',
  templateUrl: './apps-list.component.html',
  styleUrls: ['./apps-list.component.scss']
})
export class AppsListComponent implements OnInit {

  @Input() app_type: string = "";
  @Input() month: number = 0;
  headers: string[] = ["#", "Date", "Producer", "Client"];
  apps = [];
  monthForm: FormGroup = this.fb.group({ });
  months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // TODO: are apps_loaded and prod_loaded necessary ??
  apps_loaded = false;
  prod_loaded = false;
  producers: Producer[] = [];

  life_headers: string[] = ["Premium", "Mode", "Annual Premium", "Policy Type", "Product", "Client Type", "Bonus", "Status", "Paid Bonus", "Issue / Bonus Month", "Life Pivot Bonus"];
  auto_headers: string[] = ["Auto Type", "Tiers", "Bonus", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  bank_headers: string[] = ["Product Type", "Bonus", "Status", "Marketing Source"];
  fire_headers: string[] = ["Product", "Submitted Premium", "Status", "Issued Premium", "Marketing Source"];
  health_headers: string[] = ["Premium", "Mode", "Status", "Annual Premium", "Product", "Bonus", "Marketing Source"];
  mutual_funds_headers: string[] = ["Product Type", "Contribution Type", "Contribution Amount", "Marketing Source"];

  year: number = 0;

  isViewingAppList = false;

  selected_app_id = "";
  isHoveringDelete = false;

  constructor(private db: AngularFireDatabase, private fb: FormBuilder, public  db_auth:  AngularFireAuth, private dataService: DataService, private router: Router) { }

  ngOnInit(): void {    
    let date: Date = new Date(); 
    this.year = date.getFullYear();
    if (this.app_type == "") {
      this.app_type = this.router.url.substring(1);
      this.isViewingAppList = true;
    } else {
      // if app type was passed in, then it makes the tables smaller since it is being used to print the production report
      document.getElementById("appTable").classList.add("table-sm");
    }

    if (this.month == 0) {
      this.month = date.getMonth() + 1;
      this.monthForm = this.fb.group({
        month: [this.month]
      });
    }

    this.dataService.auth_state_ob.pipe(take(1)).subscribe(user => {
      if (user) {
        if (!this.apps_loaded) {
          this.loadApplications();
        }
        if (!this.prod_loaded) {
          this.loadProducers();
        }
      }
    });
  }

  loadApplications() {
    this.getHeaders();

    // by default it sorts the apps by most recent
    this.apps = this.dataService.getAppsByMonth(this.app_type, this.month);
    this.apps.sort((a, b) => b.date.localeCompare(a.date));
    this.apps_loaded = true;
  }

  loadProducers() {
    for (const producer of this.dataService.producers) {
      if (producer.hired && producer.licensed) {
        this.producers.push(producer);
      }
    }

    this.prod_loaded = true;
  }

  getHeaders() {
    this.headers = ["#", "Date", "Producer", "Client"];

    let headers_to_copy;
    if (this.app_type === "life") {
      headers_to_copy = this.life_headers;
    } else if (this.app_type === "auto") {
      headers_to_copy = this.auto_headers;
    } else if (this.app_type === "bank") {
      headers_to_copy = this.bank_headers;
    } else if (this.app_type === "fire") {
      headers_to_copy = this.fire_headers;
    } else if (this.app_type === "health") {
      headers_to_copy = this.health_headers;
    } else if (this.app_type === "mutual-funds") {
      headers_to_copy = this.mutual_funds_headers;
    }

    for (const header of headers_to_copy) {
      this.headers.push(header);
    }

    if (this.app_type != "mutual-funds") {
      this.headers.push("Co-Producer Name");
    }

    if (this.app_type != 'auto' && this.app_type != "fire" && this.app_type != "mutual-funds") {
      this.headers.push("Co-Producer Bonus");
    }
  }

  editApp(id: string) {
    this.router.navigate([this.app_type + '/' + this.year + '/' + id]);
  }

  orderList(filter: string) {
    if (filter == "date") {
      this.apps.sort((a, b) => a.date.localeCompare(b.date));
    } else if (filter == "recent") {
      this.apps.sort((a, b) => b.date.localeCompare(a.date));
    } else if (filter == "client_name") {
      this.apps.sort((a, b) => a.client_name.localeCompare(b.client_name));
    } else if (filter == "producer") {
      this.apps.sort((a, b) => this.getProducerName(a.producer_id).localeCompare(this.getProducerName(b.producer_id)));
    }
  }

  filterByMonth(month: number, producer_id: string) {
    if (month == -1) {
      this.month = ((document.getElementById("month") as HTMLInputElement).value as unknown) as number;
    } else {
      this.month = month;
    }

    if (producer_id == "") {
      producer_id = (document.getElementById("producer") as HTMLInputElement).value;
    }

    // by default it sorts the apps by most recent
    this.apps = this.dataService.getAppsByMonthAndProducer(this.app_type, this.month, producer_id);
    this.apps.sort((a, b) => b.date.localeCompare(a.date));
    
    // TODO: see if this is needed
    this.getHeaders();
  }

  getProducerName(id: string) {
    for (const producer of this.producers) {
      if (producer.id == id) {
        return producer.name;
      }
    }
  }

  confirmDelete(app: Application) {
    // change to display app type and client name
    let type = this.app_type;
    if (this.app_type == "mutual-funds") {
      type = "Mutual Funds";
    } else {
      type = type.charAt(0).toUpperCase() + type.slice(1);
    }
    document.getElementById('modalDeleteMessage').innerHTML = "Press confirm to remove " + app.client_name + "'s " + type + " app.";
    this.selected_app_id = app.id;
  }

  deleteApp() {
    let id = this.selected_app_id;
    for (let i = 0; i < this.apps.length; i++) {
      if (id == this.apps[i].id) {
        this.apps.splice(i, 1);
        break;
      }
    }
    this.db.list('apps/'+this.year+'/'+id).remove();
  }

}
