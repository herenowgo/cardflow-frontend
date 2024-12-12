/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseAnkiSyncResponse } from "../models/BaseResponseAnkiSyncResponse";
import type { BaseResponseBoolean } from "../models/BaseResponseBoolean";
import type { BaseResponseListCard } from "../models/BaseResponseListCard";
import type { CardAddRequest } from "../models/CardAddRequest";
import type { CardUpdateRequest } from "../models/CardUpdateRequest";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import { BaseResponsePageCard } from "../models/BaseResponsePageCard";
import { BaseResponseCard } from "../models/BaseResponseCard";
import { CardIdsRequest } from "../models/CardIdsRequest";

export class CardControllerService {
  /**
   * @returns BaseResponseListCard OK
   * @throws ApiError
   */
  public static getUserCards(): CancelablePromise<BaseResponseListCard> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/cards",
    });
  }

  /**
   * @param requestBody
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static updateCard(
    requestBody: CardUpdateRequest
  ): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: "PUT",
      url: "/api/cards",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param requestBody
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static createCard(
    requestBody: CardAddRequest
  ): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/cards",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param group
   * @returns BaseResponseAnkiSyncResponse OK
   * @throws ApiError
   */
  public static syncWithAnki(
    group: string
  ): CancelablePromise<BaseResponseAnkiSyncResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/cards/group/{group}/syncWithAnki",
      path: {
        group: group,
      },
    });
  }

  /**
   * @param group
   * @returns BaseResponseListCard OK
   * @throws ApiError
   */
  public static getUserGroupCards(
    group: string
  ): CancelablePromise<BaseResponseListCard> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/cards/group/{group}",
      path: {
        group: group,
      },
    });
  }

  /**
   * @param cardId
   * @returns BaseResponseBoolean OK
   * @throws ApiError
   */
  public static deleteCard(
    cardId: string
  ): CancelablePromise<BaseResponseBoolean> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/cards/{cardId}",
      path: {
        cardId: cardId,
      },
    });
  }

  /**
   * @param group
   * @param page
   * @param size
   * @returns BaseResponsePageCard OK
   * @throws ApiError
   */
  public static getUserGroupCardsWithPagination(
    group: string,
    page?: number,
    size: number = 10
  ): CancelablePromise<BaseResponsePageCard> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/cards/group/{group}/page",
      path: {
        group: group,
      },
      query: {
        page: page,
        size: size,
      },
    });
  }

  /**
   * @param cardId
   * @returns BaseResponseCard OK
   * @throws ApiError
   */
  public static getCardById(
    cardId: string
  ): CancelablePromise<BaseResponseCard> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/cards/{cardId}",
      path: {
        cardId: cardId,
      },
    });
  }

  /**
   * @param requestBody
   * @returns BaseResponseListCard OK
   * @throws ApiError
   */
  public static getCardsByIds(
    requestBody: CardIdsRequest
  ): CancelablePromise<BaseResponseListCard> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/cards/batch",
      body: requestBody,
      mediaType: "application/json",
    });
  }
}
