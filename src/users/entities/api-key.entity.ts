import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column()
  uuid: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
