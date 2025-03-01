// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title HomeFax
 * @dev A contract for storing and verifying property records on the blockchain
 * with access control to ensure only HomeFax application users can access it
 */
contract HomeFax is Ownable, ReentrancyGuard, AccessControl {
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant HOMEFAX_APP_ROLE = keccak256("HOMEFAX_APP_ROLE");
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    // Counters for generating unique IDs
    Counters.Counter private _propertyIds;
    Counters.Counter private _reportIds;

    // Structs
    struct Property {
        uint256 id;
        string propertyAddress;
        string city;
        string state;
        string zipCode;
        address owner;
        uint256 createdAt;
        uint256 updatedAt;
        bool isVerified;
    }

    struct Report {
        uint256 id;
        uint256 propertyId;
        string reportType; // "inspection", "title", "renovation", etc.
        string reportHash; // IPFS hash of the report content
        address creator;
        uint256 price;
        uint256 createdAt;
        bool isVerified;
    }

    // Mappings
    mapping(uint256 => Property) private _properties;
    mapping(uint256 => Report) private _reports;
    mapping(address => uint256[]) private _userProperties;
    mapping(uint256 => uint256[]) private _propertyReports;
    mapping(address => mapping(uint256 => bool)) private _reportPurchases;

    // Mapping to track authorized users
    mapping(address => bool) private _authorizedUsers;

    // Events
    event PropertyCreated(
        uint256 indexed id,
        string propertyAddress,
        address indexed owner
    );
    event PropertyUpdated(
        uint256 indexed id,
        string propertyAddress,
        address indexed owner
    );
    event PropertyVerified(uint256 indexed id, string propertyAddress);
    event ReportCreated(
        uint256 indexed id,
        uint256 indexed propertyId,
        string reportType,
        address indexed creator
    );
    event ReportVerified(uint256 indexed id, uint256 indexed propertyId);
    event ReportPurchased(
        uint256 indexed reportId,
        address indexed buyer,
        uint256 price
    );
    event UserAuthorized(address indexed user);
    event UserDeauthorized(address indexed user);

    // Modifiers
    modifier propertyExists(uint256 propertyId) {
        require(
            _properties[propertyId].id == propertyId,
            "Property does not exist"
        );
        _;
    }

    modifier reportExists(uint256 reportId) {
        require(_reports[reportId].id == reportId, "Report does not exist");
        _;
    }

    modifier onlyPropertyOwner(uint256 propertyId) {
        require(
            _properties[propertyId].owner == msg.sender,
            "Not the property owner"
        );
        _;
    }

    modifier onlyReportCreator(uint256 reportId) {
        require(
            _reports[reportId].creator == msg.sender,
            "Not the report creator"
        );
        _;
    }

    modifier onlyAuthorized() {
        require(
            _authorizedUsers[msg.sender] ||
                hasRole(HOMEFAX_APP_ROLE, msg.sender) ||
                hasRole(BACKEND_ROLE, msg.sender) ||
                owner() == msg.sender,
            "Not authorized to interact with HomeFax"
        );
        _;
    }

    constructor() Ownable(msg.sender) {
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BACKEND_ROLE, msg.sender);

        // The contract owner is automatically authorized
        _authorizedUsers[msg.sender] = true;
    }

    /**
     * @dev Authorizes a user to interact with the contract
     * @param user The address of the user to authorize
     */
    function authorizeUser(address user) external onlyRole(BACKEND_ROLE) {
        _authorizedUsers[user] = true;
        emit UserAuthorized(user);
    }

    /**
     * @dev Deauthorizes a user from interacting with the contract
     * @param user The address of the user to deauthorize
     */
    function deauthorizeUser(address user) external onlyRole(BACKEND_ROLE) {
        _authorizedUsers[user] = false;
        emit UserDeauthorized(user);
    }

    /**
     * @dev Checks if a user is authorized to interact with the contract
     * @param user The address of the user to check
     * @return Whether the user is authorized
     */
    function isAuthorizedUser(address user) external view returns (bool) {
        return
            _authorizedUsers[user] ||
            hasRole(HOMEFAX_APP_ROLE, user) ||
            hasRole(BACKEND_ROLE, user) ||
            owner() == user;
    }

    /**
     * @dev Grants the BACKEND_ROLE to an address
     * @param account The address to grant the role to
     */
    function addBackendRole(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(BACKEND_ROLE, account);
    }

    /**
     * @dev Grants the HOMEFAX_APP_ROLE to an address
     * @param account The address to grant the role to
     */
    function addHomeFaxAppRole(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(HOMEFAX_APP_ROLE, account);
    }

    /**
     * @dev Creates a new property record
     * @param propertyAddress The physical address of the property
     * @param city The city where the property is located
     * @param state The state where the property is located
     * @param zipCode The zip code of the property
     * @return The ID of the newly created property
     */
    function createProperty(
        string memory propertyAddress,
        string memory city,
        string memory state,
        string memory zipCode
    ) external onlyAuthorized returns (uint256) {
        _propertyIds.increment();
        uint256 propertyId = _propertyIds.current();

        Property memory newProperty = Property({
            id: propertyId,
            propertyAddress: propertyAddress,
            city: city,
            state: state,
            zipCode: zipCode,
            owner: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isVerified: false
        });

        _properties[propertyId] = newProperty;
        _userProperties[msg.sender].push(propertyId);

        emit PropertyCreated(propertyId, propertyAddress, msg.sender);
        return propertyId;
    }

    /**
     * @dev Updates an existing property record
     * @param propertyId The ID of the property to update
     * @param propertyAddress The updated physical address of the property
     * @param city The updated city where the property is located
     * @param state The updated state where the property is located
     * @param zipCode The updated zip code of the property
     */
    function updateProperty(
        uint256 propertyId,
        string memory propertyAddress,
        string memory city,
        string memory state,
        string memory zipCode
    )
        external
        propertyExists(propertyId)
        onlyPropertyOwner(propertyId)
        onlyAuthorized
    {
        Property storage property = _properties[propertyId];

        property.propertyAddress = propertyAddress;
        property.city = city;
        property.state = state;
        property.zipCode = zipCode;
        property.updatedAt = block.timestamp;

        emit PropertyUpdated(propertyId, propertyAddress, msg.sender);
    }

    /**
     * @dev Verifies a property record (only contract owner can verify)
     * @param propertyId The ID of the property to verify
     */
    function verifyProperty(
        uint256 propertyId
    ) external propertyExists(propertyId) onlyOwner {
        Property storage property = _properties[propertyId];
        property.isVerified = true;
        property.updatedAt = block.timestamp;

        emit PropertyVerified(propertyId, property.propertyAddress);
    }

    /**
     * @dev Creates a new report for a property
     * @param propertyId The ID of the property the report is for
     * @param reportType The type of report
     * @param reportHash The IPFS hash of the report content
     * @param price The price to purchase access to this report
     * @return The ID of the newly created report
     */
    function createReport(
        uint256 propertyId,
        string memory reportType,
        string memory reportHash,
        uint256 price
    ) external propertyExists(propertyId) onlyAuthorized returns (uint256) {
        _reportIds.increment();
        uint256 reportId = _reportIds.current();

        Report memory newReport = Report({
            id: reportId,
            propertyId: propertyId,
            reportType: reportType,
            reportHash: reportHash,
            creator: msg.sender,
            price: price,
            createdAt: block.timestamp,
            isVerified: false
        });

        _reports[reportId] = newReport;
        _propertyReports[propertyId].push(reportId);

        emit ReportCreated(reportId, propertyId, reportType, msg.sender);
        return reportId;
    }

    /**
     * @dev Verifies a report (only contract owner can verify)
     * @param reportId The ID of the report to verify
     */
    function verifyReport(
        uint256 reportId
    ) external reportExists(reportId) onlyOwner {
        Report storage report = _reports[reportId];
        report.isVerified = true;

        emit ReportVerified(reportId, report.propertyId);
    }

    /**
     * @dev Purchases access to a report
     * @param reportId The ID of the report to purchase
     */
    function purchaseReport(
        uint256 reportId
    ) external payable reportExists(reportId) nonReentrant onlyAuthorized {
        Report storage report = _reports[reportId];
        require(msg.value >= report.price, "Insufficient payment");
        require(
            !_reportPurchases[msg.sender][reportId],
            "Report already purchased"
        );

        _reportPurchases[msg.sender][reportId] = true;

        // Transfer payment to report creator
        (bool success, ) = payable(report.creator).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit ReportPurchased(reportId, msg.sender, msg.value);
    }

    /**
     * @dev Checks if a user has purchased a report
     * @param user The address of the user
     * @param reportId The ID of the report
     * @return Whether the user has purchased the report
     */
    function hasPurchasedReport(
        address user,
        uint256 reportId
    ) external view onlyAuthorized returns (bool) {
        return _reportPurchases[user][reportId];
    }

    /**
     * @dev Gets a property by ID
     * @param propertyId The ID of the property
     * @return The property details
     */
    function getProperty(
        uint256 propertyId
    )
        external
        view
        propertyExists(propertyId)
        onlyAuthorized
        returns (Property memory)
    {
        return _properties[propertyId];
    }

    /**
     * @dev Gets a report by ID
     * @param reportId The ID of the report
     * @return The report details
     */
    function getReport(
        uint256 reportId
    )
        external
        view
        reportExists(reportId)
        onlyAuthorized
        returns (Report memory)
    {
        return _reports[reportId];
    }

    /**
     * @dev Gets all properties owned by a user
     * @param user The address of the user
     * @return An array of property IDs owned by the user
     */
    function getUserProperties(
        address user
    ) external view onlyAuthorized returns (uint256[] memory) {
        return _userProperties[user];
    }

    /**
     * @dev Gets all reports for a property
     * @param propertyId The ID of the property
     * @return An array of report IDs for the property
     */
    function getPropertyReports(
        uint256 propertyId
    )
        external
        view
        propertyExists(propertyId)
        onlyAuthorized
        returns (uint256[] memory)
    {
        return _propertyReports[propertyId];
    }

    /**
     * @dev Gets the report content hash if the user has purchased access
     * @param reportId The ID of the report
     * @return The IPFS hash of the report content
     */
    function getReportContent(
        uint256 reportId
    )
        external
        view
        reportExists(reportId)
        onlyAuthorized
        returns (string memory)
    {
        require(
            _reportPurchases[msg.sender][reportId] ||
                _reports[reportId].creator == msg.sender ||
                owner() == msg.sender ||
                hasRole(BACKEND_ROLE, msg.sender),
            "No access to report content"
        );

        return _reports[reportId].reportHash;
    }
}
