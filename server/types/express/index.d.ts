import { IUser, IDeliveryPartner } from "../../models/index.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                isAdmin?: boolean;
            };
            partner?: IDeliveryPartner;
        }
    }
}

export {};
