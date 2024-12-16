import React, { useState } from "react";
import { FileUpload } from "./FileUpload";
import { ActionItemList } from "./ActionItemList";
import { SummaryBox } from "./Summary";
import { CombinedView } from "./CombinedView";

export const App = () => {
    const [landing, setLanding] = useState(true);

    const toggleLanding = (val) => {
        setLanding(val)
    }

    // return (
    //     <div>
    //         {/* <ActionItemList />
    //         <SummaryBox /> */}
    //         <CombinedView />
    //     </div>
    // )

    if(landing) {
        return (
            <FileUpload landingHandler={toggleLanding} />
        )
    } else {
        return (
            <div>
                <CombinedView />
            </div>
        )
    }
}