import { api } from '../lib/api';
import type { StyleBoard } from '../types';

export interface CreateBoardPayload {
  title: string;
  notes?: string;
  coverImage?: string;
  productIds?: string[];
}

export interface AddProductsPayload {
  productIds: string[];
}

export interface UpdateBoardPayload {
  title?: string;
  notes?: string;
  coverImage?: string;
  productIds?: string[];
}

export const styleBoardsApi = {
  /**
   * POST /style-boards
   */
  createBoard: (payload: CreateBoardPayload) =>
    api.post<{ board: StyleBoard }>('/style-boards', payload),

  /**
   * GET /style-boards
   */
  getBoards: () =>
    api.get<{ boards: StyleBoard[] }>('/style-boards'),

  /**
   * GET /style-boards/:id
   */
  getBoardById: (boardId: string) =>
    api.get<{ board: StyleBoard }>(`/style-boards/${boardId}`),

  /**
   * POST /style-boards/:id/products
   */
  addProducts: (boardId: string, payload: AddProductsPayload) =>
    api.post<{ board: StyleBoard }>(`/style-boards/${boardId}/products`, payload),

  /**
   * PUT /style-boards/:id
   */
  updateBoard: (boardId: string, payload: UpdateBoardPayload) =>
    api.put<{ board: StyleBoard }>(`/style-boards/${boardId}`, payload),

  /**
   * DELETE /style-boards/:id
   */
  deleteBoard: (boardId: string) =>
    api.delete(`/style-boards/${boardId}`),
};
