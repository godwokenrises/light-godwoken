export interface PagedResponse<DATA extends TypedData<any, any>, INCLUDED extends TypedData<any, any>> {
  data: DATA[];
  included: INCLUDED[];
  meta: PagedMeta;
}

export interface TypedData<TYPE extends string, ATTRIBUTES extends object> {
  id: number;
  type: TYPE;
  attributes: ATTRIBUTES;
  relationships: Relationships;
}

export interface Relationships {
  udt?: {
    data: {
      id: string;
      type: string;
    };
  };
}

export interface PagedMeta {
  current_page: number;
  total_page: number;
}
