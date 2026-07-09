import { sequelize } from "../config/db.js";
import { DataTypes } from "sequelize";

// Message model
export const Message = sequelize.define(
    "Message",
    {
        // Message id: one can use this id to track messages
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // request id: this is who ever that created the request
        requestId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        // sender id: this is who ever that delivers the request
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        // Message content should just be text (can change if needed)
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        // Attachment URL (optional)
        attachment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "messages",
        timestamps: true,
        paranoid: true,
    }
);
