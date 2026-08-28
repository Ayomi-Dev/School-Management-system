export type ParamsContext = {
    params: Promise<{id?: string, studentId?: string}>
}

export type ClassParamsContext = {
    params: Promise<{ 
        classId?: string, 
        subjectId?: string, 
        reportCardId?: string,
        slotId?: string
    }>
} 