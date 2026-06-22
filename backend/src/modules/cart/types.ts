export interface AddCartItemRequestDTO {
  menuItemId: string;
  quantity: number;
}

export interface UpdateCartItemRequestDTO {
  quantity: number;
}

export interface CartItemParamsDTO {
  itemId: string;
}

export interface CartMenuItemDTO {
  id: string;
  name: string;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface CartItemResponseDTO {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  menuItem: CartMenuItemDTO;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponseDTO {
  id: string;
  userId: string;
  restaurantId: string | null;
  subtotal: number;
  totalAmount: number;
  isActive: boolean;
  items: CartItemResponseDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ClearCartResponseDTO {
  cleared: true;
}
