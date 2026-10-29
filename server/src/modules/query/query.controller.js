import { z } from 'zod';
import { queryService } from './query.service.js';

const executeQuerySchema = z.object({
  query: z.string().min(1, 'SQL query cannot be empty').max(10000, 'Query too long'),
  params: z.array(z.any()).optional().default([]),
});

export const executeQuery = async (req, res, next) => {
  try {
    const { query, params } = executeQuerySchema.parse(req.body);
    const result = await queryService.executeQuery(query, params);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Query executed successfully',
    });
  } catch (error) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query payload',
          details: error.errors,
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 'SQL_EXECUTION_ERROR',
        message: error.message || 'Error executing SQL query',
      },
    });
  }
};

export const getSchema = async (req, res, next) => {
  try {
    const schema = await queryService.getSchema();
    res.status(200).json({
      success: true,
      data: schema,
    });
  } catch (error) {
    next(error);
  }
};

export const getPresets = async (req, res, next) => {
  try {
    const presets = queryService.getPresets();
    res.status(200).json({
      success: true,
      data: presets,
    });
  } catch (error) {
    next(error);
  }
};
