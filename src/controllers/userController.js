const crypto = require("crypto");
const User = require("../models/User");

function buildFilters(query) {
  const filter = {};

  if (query.name) {
    filter.name = { $regex: query.name, $options: "i" };
  }

  if (query.email) {
    filter.email = query.email.toLowerCase();
  }

  if (query.age !== undefined) {
    filter.age = Number(query.age);
  }

  if (query.hobby) {
    filter.hobbies = query.hobby;
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
}

function buildRegexSearchFilter(query) {
  const filter = buildFilters({ ...query, search: undefined });

  if (query.search) {
    filter.bio = { $regex: query.search, $options: "i" };
  }

  return filter;
}

function buildSort(sortBy = "createdAt", order = "desc") {
  return { [sortBy]: order === "asc" ? 1 : -1 };
}

function normalizeUserPayload(body) {
  const payload = { ...body };

  if (body.email !== undefined) {
    payload.email = body.email.toLowerCase().trim();
  }

  if (Array.isArray(body.hobbies)) {
    payload.hobbies = body.hobbies.map((hobby) => String(hobby).trim()).filter(Boolean);
  }

  if (body.userId !== undefined) {
    payload.userId = body.userId.trim();
  }

  return payload;
}

async function createUser(req, res, next) {
  try {
    const payload = normalizeUserPayload(req.body);
    if (!payload.userId) {
      payload.userId = crypto.randomUUID();
    }
    const user = await User.create(payload);
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const filter = buildFilters(req.query);
    const sort = buildSort(req.query.sortBy, req.query.order);

    let users;
    let total;

    try {
      [users, total] = await Promise.all([
        User.find(filter, req.query.search ? { score: { $meta: "textScore" } } : {})
          .sort(req.query.search ? { score: { $meta: "textScore" } } : sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter)
      ]);
    } catch (error) {
      const isMissingTextIndex =
        req.query.search &&
        (error.codeName === "IndexNotFound" || error.message.toLowerCase().includes("text index required"));

      if (!isMissingTextIndex) {
        throw error;
      }

      const regexFilter = buildRegexSearchFilter(req.query);
      [users, total] = await Promise.all([
        User.find(regexFilter)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(regexFilter)
      ]);
    }

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const payload = normalizeUserPayload(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
