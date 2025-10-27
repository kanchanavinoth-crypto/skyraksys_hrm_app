// Service layer for business logic separation
const ApiResponse = require('../utils/ApiResponse');

class BaseService {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        where = {},
        include = [],
        order = [['createdAt', 'DESC']]
      } = options;

      const offset = (page - 1) * limit;

      const { count, rows } = await this.model.findAndCountAll({
        where,
        include,
        order,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems: count,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Error fetching ${this.model.name} records: ${error.message}`);
    }
  }

  async findById(id, include = []) {
    try {
      const record = await this.model.findByPk(id, { include });
      if (!record) {
        throw new Error(`${this.model.name} not found`);
      }
      return record;
    } catch (error) {
      throw new Error(`Error fetching ${this.model.name}: ${error.message}`);
    }
  }

  async create(data) {
    try {
      const record = await this.model.create(data);
      return record;
    } catch (error) {
      throw new Error(`Error creating ${this.model.name}: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const record = await this.findById(id);
      const updatedRecord = await record.update(data);
      return updatedRecord;
    } catch (error) {
      throw new Error(`Error updating ${this.model.name}: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const record = await this.findById(id);
      await record.destroy();
      return true;
    } catch (error) {
      throw new Error(`Error deleting ${this.model.name}: ${error.message}`);
    }
  }

  async findOne(where, include = []) {
    try {
      const record = await this.model.findOne({ where, include });
      return record;
    } catch (error) {
      throw new Error(`Error finding ${this.model.name}: ${error.message}`);
    }
  }

  async count(where = {}) {
    try {
      const count = await this.model.count({ where });
      return count;
    } catch (error) {
      throw new Error(`Error counting ${this.model.name}: ${error.message}`);
    }
  }

  async bulkCreate(dataArray) {
    try {
      const records = await this.model.bulkCreate(dataArray);
      return records;
    } catch (error) {
      throw new Error(`Error bulk creating ${this.model.name}: ${error.message}`);
    }
  }

  async bulkUpdate(where, data) {
    try {
      const [affectedCount] = await this.model.update(data, { where });
      return affectedCount;
    } catch (error) {
      throw new Error(`Error bulk updating ${this.model.name}: ${error.message}`);
    }
  }

  async bulkDelete(where) {
    try {
      const affectedCount = await this.model.destroy({ where });
      return affectedCount;
    } catch (error) {
      throw new Error(`Error bulk deleting ${this.model.name}: ${error.message}`);
    }
  }
}

module.exports = BaseService;
