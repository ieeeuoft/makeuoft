import { Box, IconButton, InputAdornment, TextField } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import SearchIcon from "@material-ui/icons/Search";
import { Formik, FormikValues } from "formik";
import styles from "pages/Orders/Orders.module.scss";
import { connect, ConnectedProps, useSelector } from "react-redux";
import {
    adminOrderFiltersSelector,
    getOrdersWithFilters,
    isLoadingSelector,
    setFilters,
} from "slices/order/adminOrderSlice";
import { RootState } from "slices/store";

interface SearchValues {
    search: string;
}

const OrdersSearch = ({
    values: { search },
    handleChange,
    handleReset,
    handleSubmit,
}: FormikValues) => {
    return (
        <form onReset={handleReset} onSubmit={handleSubmit} autoComplete="off">
            <Box display="flex" flexDirection="row">
                <TextField
                    className={styles.ordersBodyToolbarSearch}
                    id="search-input"
                    name="search"
                    label="Search items"
                    variant="outlined"
                    type="text"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={handleReset}
                                    data-testid="clear-button"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    value={search}
                    onChange={handleChange}
                />
                <IconButton
                    color="primary"
                    aria-label="Search"
                    onClick={handleSubmit}
                    data-testid="search-button"
                    className={styles.ordersBodyToolbarIconButton}
                >
                    <SearchIcon />
                </IconButton>
            </Box>
        </form>
    );
};

export const EnhancedOrderSearch = ({
    getOrdersWithFilters,
    setFilters,
}: ConnectedOrderSearchProps) => {
    // const initialValues = {
    //     search: "",
    // };
    // Seed the search box from the persisted admin order filters (loaded from
    // localStorage at store init). This is read once on mount; we intentionally
    // do NOT use Formik's `enableReinitialize` here, because reinitializing on
    // every filter change makes Formik fire `onReset`, which would clobber the
    // search the user just submitted.
    const savedFilters = useSelector(adminOrderFiltersSelector);
    const initialValues = {
        search: savedFilters.search ?? "",
    };

    const onSubmit = ({ search }: SearchValues) => {
        setFilters({ search });
        getOrdersWithFilters();
    };

    // Clearing the search box removes the search filter while preserving any
    // other active filters (status, ordering, etc.).
    const onReset = () => {
        setFilters({ search: "" });
        getOrdersWithFilters();
    };

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={onSubmit}
            onReset={onReset}
            validateOnBlur={false}
            validateOnChange={false}
        >
            {(formikProps) => <OrdersSearch {...formikProps} />}
        </Formik>
    );
};

const mapStateToProps = (state: RootState) => ({
    isLoading: isLoadingSelector(state),
});

const connector = connect(mapStateToProps, {
    getOrdersWithFilters,
    setFilters,
});

type ConnectedOrderSearchProps = ConnectedProps<typeof connector>;

export const ConnectedOrderSearch = connector(EnhancedOrderSearch);

export default ConnectedOrderSearch;
