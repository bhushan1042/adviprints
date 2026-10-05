export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryName: string;
  tags: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  description: string;
  features: string[];
  bestseller?: boolean;
  isNew?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
  styles: string;
}
