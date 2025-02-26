import {makeAutoObservable} from 'mobx';
import {DocumentType} from '@app/utils/types/document';

type Step = 'select-document' | 'select-photo';

export class NewPhotoStore {
  currentStep: Step = 'select-document';
  selectedDocument: DocumentType | null = null;
  searchQuery: string = '';
  selectedPhoto: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  setCurrentStep = (step: Step) => {
    this.currentStep = step;
  };

  setSelectedDocument = (document: DocumentType | null) => {
    this.selectedDocument = document;
  };

  setSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  setSelectedPhoto = (photo: string | null) => {
    this.selectedPhoto = photo;
  };

  // Reset actions
  reset = () => {
    this.currentStep = 'select-document';
    this.selectedDocument = null;
    this.searchQuery = '';
    this.selectedPhoto = null;
  };

  // Navigation actions
  goToSelectPhoto = () => {
    if (this.selectedDocument) {
      this.setCurrentStep('select-photo');
    }
  };

  goToSelectDocument = () => {
    this.setCurrentStep('select-document');
  };
}
