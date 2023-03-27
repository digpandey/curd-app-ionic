import {Component, Renderer2, ViewChild} from '@angular/core';
import {Storage} from '@capacitor/storage';
import {AlertController} from "@ionic/angular";
import {Camera, CameraResultType} from "@capacitor/camera";
import {DomSanitizer} from "@angular/platform-browser";

interface Item {
  id: number;
  title: string;
  dis: string;
  image: string;
  img: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('fileInput') fileInput: any;

  items: Item[] = [];
  newItem: Item = {id: 0, title: '', dis: '',image: '', img: ''};
  selectedItem: Item = {id: 0, title: '', dis: '', image: '', img: ''};
  editMode = false;

  constructor( private alertController: AlertController, private renderer: Renderer2,
               private sanitizer: DomSanitizer) {
    this.loadItems().then();
  }

  async loadItems() {
    const {value} = await Storage.get({key: 'items'});
    if (value) {
      this.items = JSON.parse(value);
      console.log('item', this.items);
      this.items.forEach(res =>{
        if (res.img) {
          res.image = <string>this.sanitizer.bypassSecurityTrustResourceUrl(`data:image/jpeg;base64,${res.img}`);
        }
      })
    }
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64
    });
    if (image.base64String != null) {
      this.newItem.img = image.base64String;
    }
  }
  async saveItems() {
    await Storage.set({
      key: 'items',
      value: JSON.stringify(this.items)
    });
   this.loadItems().then()
  }

  addItem() {
    const newItem: Item = { id: Date.now(), title: this.newItem.title, dis: this.newItem.dis, img: this.newItem.img, image: ''};
    this.items.push(newItem);
    this.newItem = { id: 0, title: '', dis: '', img: '',  image: ''};
    this.saveItems().then();
    this.resetFileInput();
  }
  resetFileInput() {
    this.renderer.setProperty(this.fileInput.nativeElement, 'value', '');
  }

  editItem(item: Item) {
    this.selectedItem = {...item};
    this.editMode = true;
  }

  updateItem() {
    const index = this.items.findIndex(item => item.id === this.selectedItem.id);
    if (index !== -1) {
      this.items[index] = this.selectedItem;
      this.saveItems().then();
    }
    this.selectedItem = { id: 0, title: '', dis: '', img: '', image: ''};
    this.editMode = false;
  }


  deleteItem(item: Item) {
    const index = this.items.findIndex(i => i.title === item.title);
    if (index !== -1)
      this.items.splice(index, 1);
    this.saveItems().then();
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.uploadImage(file).then();

  }
  async uploadImage(file: any) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      // @ts-ignore
      this.newItem.img =reader.result.toString().split(',')[1];
    };
  }
  async viewPhoto(val: any) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class1',
      header: 'Photo',
      message: `<img src="${val.image}" width="400px" height="400px" alt=""/>`,
      buttons: [
        {
          text: 'Close',
          handler: () => {
            alert.dismiss();
          }
        },
        {
          text: 'Remove',
          handler: () => {
            val.img = '';
            this.editItem(val);
            this.updateItem()
          },
        }
      ]
    });
    await alert.present();
  }
}
