import { sequelize } from "../config/db.js";
import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        is: {
          args: /^[\w.]+$/,
          msg: "Username can only have letters, numbers, and period",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          args: true,
          msg: "Please enter a valid email address",
        },
        len: [5, 255],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 120],
        isStrongEnough(value) {
          const strongRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
          if (!strongRegex.test(value)) {
            throw new Error(
              `Password must have: ≥8 characters, uppercase letter, lowercase letter, special character: @$!%*?&.`,
            );
          }
        },
      },
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "default.jpg",
      validate: {
        is: /^[\w-]+\.(jpg|jpeg|png|gif)$/,
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
    paranoid: true,
    validate: {
      uniqueUsernameEmail() {
        if (this.username.toLowerCase() === this.email.toLowerCase()) {
          throw new Error("Username and email cannot be the same");
        }
      },
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
    },
  },
);
