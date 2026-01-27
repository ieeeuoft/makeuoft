import React from "react";
import styles from "./OrderCard.module.scss";
import { Typography, Container, Card } from "@material-ui/core";

interface OrderProps {
    teamCode: string;
    orderQuantity: number;
    time: string;
    id: number;
    status: string;
    packingAdminName?: string | null; // display who is packing this order
}

const OrderCard = ({
    teamCode,
    orderQuantity,
    time,
    id,
    status,
    packingAdminName,
}: OrderProps) => {
    const date = new Date(time);
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    const hoursAndMinutes =
        date.getHours() +
        ":" +
        ((date.getMinutes() < 10 ? "0" : "") + date.getMinutes());

    const orderDetails = [
        { title: "Team", value: teamCode },
        { title: "Status", value: status },
        { title: "Order Qty", value: orderQuantity },
        { title: "Time", value: `${month} ${day}, ${hoursAndMinutes}` },
        { title: "ID", value: id },
        // show which admin is packing this order when status is "In Progress"
        ...(status === "In Progress" && packingAdminName
            ? [{ title: "Packing Admin", value: packingAdminName }]
            : []),
    ];

    return (
        <Card>
            <Container className={styles.container} data-testid={`order-item-${id}`}>
                {orderDetails.map((item, idx) => (
                    <Container className={styles.contentContainer} key={idx}>
                        <Typography variant="body2" className={styles.title}>
                            {item.title}
                        </Typography>
                        <Typography variant="body2" style={{ textAlign: "end" }}>
                            {item.value}
                        </Typography>
                    </Container>
                ))}
            </Container>
        </Card>
    );
};

export default OrderCard;
