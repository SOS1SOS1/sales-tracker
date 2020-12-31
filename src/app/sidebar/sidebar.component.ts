import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  // env is used in html to only display sidebar if user is logged in
  env = environment;

  constructor(public  db_auth:  AngularFireAuth) { }

  ngOnInit(): void {
  }

  openSidebar() {
    document.getElementById("sidebar").style.width = "250px";
  }

  closeSidebar() {
    document.getElementById("sidebar").style.width = "50px";
  }

  async logout(){
    await this.db_auth.signOut();
  }

}
