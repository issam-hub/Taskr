import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Users } from "../users/entity.js";

export type NotificationChannel = "IN_APP" | "EMAIL" | "REALTIME";

@Entity()
export class Notifications {
  @PrimaryGeneratedColumn("uuid")
  notification_id: string;

  @Column({ name: "user_id" })
  user_id: string;

  @ManyToOne(() => Users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: Users;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  action_url: string;

  @Column({ type: "boolean", default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
