import { ValidationError } from "./errors.js";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ValidatedPagination {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
}

// TODO: Usar esse helper onde implementa paginação
export const validatePagination = (
  page: number,
  pageSize: number,
): ValidatedPagination => {
  if (!page || page < 1) {
    throw new ValidationError("Page must be >= 1", "page");
  }

  if (!pageSize || pageSize < 1 || pageSize > 100) {
    throw new ValidationError(
      "O tamanho da página deve ficar entre 1 e 100",
      "pageSize",
    );
  }

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
};
