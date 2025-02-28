import { PrismaClient, Prisma } from '@prisma/client';

type PaginationResult<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

const paginate = async <T>(
  model: { findMany: Function; count: Function },
  page: number = 1,
  limit: number = 10,
  filterCondition?: Prisma.PrismaClientKnownRequestError | object,
  includeFields?: object,
  orderBy?: object
): Promise<PaginationResult<T>> => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where: filterCondition,
      include: includeFields,
      skip,
      take: limit,
      orderBy,
    }),
    model.count({ where: filterCondition }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export default paginate;