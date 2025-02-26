import {makeAutoObservable} from 'mobx';
import {PhotoResponse} from '@app/utils/types/api';

export class PhotosStore {
  photos: PhotoResponse[] = [];
  isLoading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setPhotos = (photos: PhotoResponse[]) => {
    this.photos = photos;
  };

  setIsLoading = (loading: boolean) => {
    this.isLoading = loading;
  };

  addPhoto = (photo: PhotoResponse) => {
    this.photos = [photo, ...this.photos];
  };

  deletePhoto = (id: number) => {
    this.photos = this.photos.filter(photo => photo.id !== id);
  };

  updatePhoto = (id: number, updatedPhoto: PhotoResponse) => {
    const existingPhoto = this.photos.find(photo => photo.id === id);
    if (!existingPhoto) {
      // If photo doesn't exist yet, add it to the top of the list
      this.photos = [updatedPhoto, ...this.photos];
      return;
    }

    const updatedPhotoFull: PhotoResponse = {...existingPhoto, ...updatedPhoto};
    this.photos = this.photos.map(photo => (photo.id === id ? updatedPhotoFull : photo));
  };
}
