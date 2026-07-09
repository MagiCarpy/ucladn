import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Request = sequelize.define(
  "Request",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    item: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    pickupLocation: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    dropoffLocation: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("open", "accepted", "completed"),
      defaultValue: "open",
    },
    helperId: {
      type: DataTypes.UUID,
      allowNull: true, // gets filled when someone accepts
    },
    deliveryPhotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiverConfirmed: {
      type: DataTypes.ENUM("pending", "received"),
      defaultValue: "pending",
    },
    pickupLat: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    pickupLng: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    dropoffLat: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    dropoffLng: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "requests",
    timestamps: true,
    paranoid: true,
  }
);
