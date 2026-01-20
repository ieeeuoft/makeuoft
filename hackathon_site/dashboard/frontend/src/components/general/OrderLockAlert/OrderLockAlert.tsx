import React from "react";
import { useSelector } from "react-redux";
import AlertBox from "components/general/AlertBox/AlertBox";
import { ordersLockedSelector } from "slices/hardware/orderLockSlice";

const OrderLockAlert = () => {
    const ordersLocked = useSelector(ordersLockedSelector);

    return ordersLocked ? (
        <AlertBox
            data-testid="order-lock-alert"
            title="Order Submissions Currently Locked"
            error="Hardware order submissions are currently locked by administrators. Please contact the hardware team at hardware@makeuoft.ca for assistance."
            type="warning"
        />
    ) : null;
};

export default OrderLockAlert;
