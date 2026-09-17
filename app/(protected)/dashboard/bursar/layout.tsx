import { BursarDashboardLayout } from "@/src/components/layouts";

const BursarLayout = ( { children } : { children: React.ReactNode }) => {
    return (
        <BursarDashboardLayout>
            { children }
        </BursarDashboardLayout>
    )
}

export default BursarLayout;