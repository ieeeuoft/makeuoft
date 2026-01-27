import React, { ReactElement } from "react";
import { Alert, AlertTitle } from "@material-ui/lab";

interface ErrorBoxProps {
    error?: string[] | string | object;
    body?: ReactElement;
    type?: "error" | "info" | "success" | "warning";
    title?: string;
}

const AlertBox = ({ error, body, type, title, ...otherProps }: ErrorBoxProps) => {
    // Helper function to convert error to displayable string
    const getErrorMessage = (err: unknown): string => {
        if (typeof err === "string") return err;
        if (typeof err === "object" && err !== null) {
            // Handle common error object shapes
            if ("message" in err) return String((err as { message: unknown }).message);
            if ("detail" in err) return String((err as { detail: unknown }).detail);
            if ("error" in err) return String((err as { error: unknown }).error);
            return JSON.stringify(err);
        }
        return String(err);
    };

    return (
        <Alert
            severity={type ?? "error"}
            style={{ margin: "15px 0px" }}
            {...otherProps}
        >
            {Array.isArray(error) ? (
                <>
                    <AlertTitle>{title ?? "An error has occurred because:"}</AlertTitle>
                    <ul style={{ marginLeft: "20px" }} data-testid="alert-error-list">
                        {error.map((err, index) => (
                            <li key={index}>{getErrorMessage(err)}</li>
                        ))}
                    </ul>
                </>
            ) : (
                <>
                    <AlertTitle>{title ?? "An error has occurred"}</AlertTitle>
                    {body || getErrorMessage(error)}
                </>
            )}
        </Alert>
    );
};

export default AlertBox;
