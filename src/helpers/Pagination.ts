import { Prisma } from '@prisma/client';

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
  try {
    const skip = (page - 1) * limit;

    // Validate model methods
    if (typeof model.findMany !== 'function' || typeof model.count !== 'function') {
      throw new Error('Invalid model: findMany and count methods are required');
    }

    // Validate filter condition
    const where = filterCondition && typeof filterCondition === 'object' 
      ? filterCondition 
      : {};

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        include: includeFields || {},
        skip,
        take: limit,
        orderBy: orderBy || { createdAt: 'desc' },
      }),
      model.count({ where }),
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
  } catch (error) {
    console.error('Pagination error:', error);
    throw error;
  }
};

export default paginate;