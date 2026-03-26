export interface TestimonialModel {
  docId: string;
  title: string;
  videoLink: string;
  author: string;
  cityCounty: string;
  createdAt: Date;
  isActive: boolean;
  showOnHomePage: boolean;
  image?: string;
  quote?: string;
}

export interface TestimonialCardData {
  quote: string;
  author: string;
  location: string;
  image: string;
  videoLink?: string;
}
