import BursarLayoutClient from "./components/BursarLayout";

const BursarLayout = ( { children } : { children: React.ReactNode }) => {
    return (
        <BursarLayoutClient>
            { children }
        </BursarLayoutClient>
    )
}

export default BursarLayout;