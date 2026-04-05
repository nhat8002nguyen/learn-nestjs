import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../enums/role.enum";
import { ApiKey } from "./api-key.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: Role, default: Role.Regular })
  role: Role;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user, { cascade: true })
  apiKeys: ApiKey[];
}
