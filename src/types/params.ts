export type ParamsContext = {
    params: Promise<{id: string}>
}

export type ClassParamsContext = {
    params: Promise<{ classId: string, subjectId: string}>
}