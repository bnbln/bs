import React from 'react';
import GridMotion from './GridMotion';

const GridMotionExample = () => {
  // Brands data from the original component
  const brands = [
    { name: 'WELT', image: 'http://localhost:3845/assets/7c3844c561def42f2dda63f8d8b64f536f9e2b32.png', width: 'w-32', height: 'h-[45px]' },
    { name: 'Brand 2', image: 'http://localhost:3845/assets/44c7194279e504a6d5479b93d1cf51d590d49c1e.png', width: 'w-[181px]', height: 'h-[95px]' },
    { name: 'BM', text: 'BM', width: 'w-32', height: 'h-[45px]' },
    { name: 'Brand 4', image: 'http://localhost:3845/assets/2f11168a714a16334e04f0d7fb6af62727867736.png', width: 'w-[143px]', height: 'h-[81px]' },
    { name: 'Rechtsklarheit.de', text: 'Rechtsklarheit.de', width: 'w-auto', height: 'h-auto' },
    { name: 'N24', image: 'http://localhost:3845/assets/9be11a37bfb23ea6c94c0ac52bd8325999cf599d.png', width: 'w-[124px]', height: 'h-[60px]' },
    { name: 'Brand 7', image: 'http://localhost:3845/assets/84c124e7ac54ed261174808b34cfe900fdcf94b2.png', width: 'w-[104px]', height: 'h-[67px]' },
    { name: 'Brand 8', image: 'http://localhost:3845/assets/1fda2c319346dbb13219dc8e5d107bc5b24bde51.png', width: 'w-[145px]', height: 'h-[41.461px]' },
    { name: 'Brand 9', image: 'http://localhost:3845/assets/1ca1ba05e36df11bfdb6cf2c6a85e132ff5ab697.png', width: 'w-[73px]', height: 'h-[73px]' },
    { name: 'Brand 10', image: 'http://localhost:3845/assets/4c5f76d086f756e7603bc72bad23ff84ac969c98.png', width: 'w-[204px]', height: 'h-[42px]' }
  ];

  // Create items array with only the 10 brands, distributed across the grid
  const items = [
    // Row 1: First 7 brands
    brands[0]?.image || brands[0]?.text || brands[0]?.name,
    brands[1]?.image || brands[1]?.text || brands[1]?.name,
    brands[2]?.image || brands[2]?.text || brands[2]?.name,
    brands[3]?.image || brands[3]?.text || brands[3]?.name,
    brands[4]?.image || brands[4]?.text || brands[4]?.name,
    brands[5]?.image || brands[5]?.text || brands[5]?.name,
    brands[6]?.image || brands[6]?.text || brands[6]?.name,
    
    // Row 2: Last 3 brands + 4 empty spaces
    brands[7]?.image || brands[7]?.text || brands[7]?.name,
    brands[8]?.image || brands[8]?.text || brands[8]?.name,
    brands[9]?.image || brands[9]?.text || brands[9]?.name,
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    
    // Row 3: Empty spaces
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    
    // Row 4: Empty spaces
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
    '', // Empty space
  ];

  return (
    <div className="h-[50vh] w-full">
      <GridMotion items={items} gradientColor="rgba(0,0,0,0.1)" />
    </div>
  );
};

export default GridMotionExample; 